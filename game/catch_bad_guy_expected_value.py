#!/usr/bin/env python3
"""
抓坏仔游戏期望值计算器
规则：
- Lucky 路线：累计 Lucky 数兑奖（2+ 起兑）
- 坏仔路线：必须连续 3-5 个坏仔才得奖，1-2 个坏仔 = ¥0
- 混合路线（先 Lucky 后坏仔）：¥5 安慰奖
"""

from functools import lru_cache
from math import factorial
import random

# 卡片配置
LUCKY_CARDS = 8      # 🍀 Lucky (每张 +1)
DOUBLE_CARDS = 1     # ✖️2 Lucky x2 (每张 +2)
REVIVE_CARDS = 1     # 🔄 复活（不影响路线）
BAD_CARDS = 5        # 💀 坏仔
TOTAL_CARDS = LUCKY_CARDS + DOUBLE_CARDS + REVIVE_CARDS + BAD_CARDS  # 15

# 奖品配置
PRIZES_LUCKY = {
    2: 80, 3: 120, 4: 200, 5: 350, 6: 500,
    7: 700, 8: 900, 9: 2100, 10: 3000
}

# 坏仔奖品：只有 3,4,5 个才得奖
PRIZES_BAD = {
    3: 150, 4: 300, 5: 400
}

def get_lucky_prize(lucky_count):
    if lucky_count < 2:
        return 5
    best = 5
    for lc, prize in PRIZES_LUCKY.items():
        if lc <= lucky_count:
            best = max(best, prize)
    return best

def get_bad_prize(bad_count):
    if bad_count < 3:
        return 0  # 1-2 个坏仔，0 元
    best = 0
    for bc, prize in PRIZES_BAD.items():
        if bc <= bad_count:
            best = max(best, prize)
    return best

@lru_cache(maxsize=None)
def state_value(lucky_rem, double_rem, revive_rem, bad_rem, cur_lucky, cur_bad, has_lucky):
    """
    计算某个状态的最优期望值（可以选择下车或继续）
    """
    total_rem = lucky_rem + double_rem + revive_rem + bad_rem

    # 游戏结束
    if total_rem == 0:
        if has_lucky and cur_bad > 0:
            return 5.0
        elif has_lucky and cur_lucky >= 2:
            return float(get_lucky_prize(cur_lucky))
        elif not has_lucky and cur_bad >= 3:
            return float(get_bad_prize(cur_bad))
        else:
            return 5.0 if (cur_lucky > 0 or cur_bad > 0) else 0.0

    # 当前下车能拿到的
    if has_lucky and cur_bad > 0:
        cash_value = 5.0
    elif has_lucky and cur_lucky >= 2:
        cash_value = float(get_lucky_prize(cur_lucky))
    elif not has_lucky and cur_bad >= 3:
        cash_value = float(get_bad_prize(cur_bad))
    else:
        cash_value = 0.0

    # 继续的期望
    ev_continue = 0.0
    total = total_rem

    if lucky_rem > 0:
        if cur_bad > 0:
            ev_continue += (lucky_rem / total) * 5.0
        else:
            ev_continue += (lucky_rem / total) * state_value(
                lucky_rem-1, double_rem, revive_rem, bad_rem, cur_lucky+1, cur_bad, True)

    if double_rem > 0:
        if cur_bad > 0:
            ev_continue += (double_rem / total) * 5.0
        else:
            ev_continue += (double_rem / total) * state_value(
                lucky_rem, double_rem-1, revive_rem, bad_rem, cur_lucky+2, cur_bad, True)

    if revive_rem > 0:
        ev_continue += (revive_rem / total) * state_value(
            lucky_rem, double_rem, revive_rem-1, bad_rem, cur_lucky, cur_bad, has_lucky)

    if bad_rem > 0:
        if has_lucky:
            ev_continue += (bad_rem / total) * 5.0
        else:
            ev_continue += (bad_rem / total) * state_value(
                lucky_rem, double_rem, revive_rem, bad_rem-1, cur_lucky, cur_bad+1, False)

    if cash_value > 0:
        return max(cash_value, ev_continue)
    else:
        return ev_continue

def calculate_optimal_ev():
    return state_value(LUCKY_CARDS, DOUBLE_CARDS, REVIVE_CARDS, BAD_CARDS, 0, 0, False)

def monte_carlo_full(n_sims=1000000):
    """
    蒙特卡洛模拟，统计完整分布
    """
    from collections import defaultdict

    dist = defaultdict(int)
    total_winnings = 0.0
    optimal_winnings = 0.0

    for _ in range(n_sims):
        deck = ['L']*LUCKY_CARDS + ['D']*DOUBLE_CARDS + ['R']*REVIVE_CARDS + ['B']*BAD_CARDS
        random.shuffle(deck)
        cur_lucky, cur_bad, has_lucky = 0, 0, False
        winnings = 0
        lr, dr, rr, br = LUCKY_CARDS, DOUBLE_CARDS, REVIVE_CARDS, BAD_CARDS
        cashed_out = False

        for card in deck:
            if card == 'L':
                lr -= 1
                if cur_bad > 0:
                    winnings = 5
                    break
                cur_lucky += 1
                has_lucky = True
            elif card == 'D':
                dr -= 1
                if cur_bad > 0:
                    winnings = 5
                    break
                cur_lucky += 2
                has_lucky = True
            elif card == 'R':
                rr -= 1
            elif card == 'B':
                br -= 1
                if has_lucky:
                    winnings = 5
                    break
                cur_bad += 1

            # 检查最优策略
            if has_lucky and cur_bad > 0:
                winnings = 5
                break
            elif has_lucky and cur_lucky >= 2:
                cash = get_lucky_prize(cur_lucky)
                cont = state_value(lr, dr, rr, br, cur_lucky, cur_bad, has_lucky)
                if cash >= cont:
                    winnings = cash
                    cashed_out = True
                    break
            elif not has_lucky and cur_bad >= 3:
                cash = get_bad_prize(cur_bad)
                cont = state_value(lr, dr, rr, br, cur_lucky, cur_bad, has_lucky)
                if cash >= cont:
                    winnings = cash
                    cashed_out = True
                    break

        if winnings == 0:
            if has_lucky and cur_bad > 0:
                winnings = 5
            elif has_lucky and cur_lucky >= 2:
                winnings = get_lucky_prize(cur_lucky)
            elif not has_lucky and cur_bad >= 3:
                winnings = get_bad_prize(cur_bad)
            else:
                winnings = 5 if (cur_lucky > 0 or cur_bad > 0) else 0

        dist[winnings] += 1
        total_winnings += winnings

    return dist, total_winnings / n_sims

if __name__ == "__main__":
    print("=" * 60)
    print("抓坏仔游戏期望值分析")
    print("规则：1-2 个坏仔=¥0，3-5 个坏仔才有奖")
    print("=" * 60)

    print(f"\n【卡片配置】共 {TOTAL_CARDS} 张")
    print(f"  🍀 Lucky: {LUCKY_CARDS} 张 (+1 each)")
    print(f"  ✖️2 Lucky x2: {DOUBLE_CARDS} 张 (+2)")
    print(f"  🔄 复活：{REVIVE_CARDS} 张")
    print(f"  💀 坏仔：{BAD_CARDS} 张")

    print(f"\n【奖品表】")
    print("Lucky 路线:")
    for lc, prize in sorted(PRIZES_LUCKY.items()):
        print(f"  {lc} Lucky = ¥{prize}")
    print("坏仔路线:")
    print("  1-2 坏仔 = ¥0")
    for bc, prize in sorted(PRIZES_BAD.items()):
        print(f"  {bc} 坏仔 = ¥{prize}")

    print(f"\n{'=' * 60}")
    print("【期望值】")
    print(f"{'=' * 60}")

    ev_opt = calculate_optimal_ev()
    print(f"\n最优策略期望值：¥{ev_opt:.2f}")

    dist, ev_mc = monte_carlo_full(500000)
    print(f"蒙特卡洛模拟 (50 万次)：¥{ev_mc:.2f}")

    print(f"\n{'=' * 60}")
    print("【概率分布】（最优策略下）")
    print(f"{'=' * 60}")

    total_sims = sum(dist.values())

    print(f"\n{'奖金':>8} | {'次数':>10} | {'概率':>8} | {'期望贡献':>10}")
    print("-" * 50)

    exp_val = 0
    for prize in sorted(dist.keys(), reverse=True):
        count = dist[prize]
        prob = count / total_sims
        contrib = prize * prob
        exp_val += contrib
        print(f"¥{prize:>7} | {count:>10,} | {prob:>7.2%} | ¥{contrib:>9.4f}")

    print("-" * 50)
    print(f"{'合计':>8} | {total_sims:>10,} | {100:>7.2f}% | ¥{exp_val:>9.2f}")

    print(f"\n{'=' * 60}")
    print("【路线分析】")
    print(f"{'=' * 60}")

    # 分类统计
    lucky_wins = sum(cnt for p, cnt in dist.items() if p >= 80)  # Lucky 路线赢奖
    bad_wins = sum(cnt for p, cnt in dist.items() if p in [150, 300, 400])  # 坏仔路线赢奖
    consolation = dist.get(5, 0)  # 安慰奖
    zero = dist.get(0, 0)  # 1-2 坏仔 0 元

    print(f"\n纯 Lucky 路线赢奖 (>=¥80): {lucky_wins:,} ({lucky_wins/total_sims:.1%})")
    print(f"纯坏仔路线赢奖 (>=¥150): {bad_wins:,} ({bad_wins/total_sims:.1%})")
    print(f"混合路线 (¥5 安慰奖): {consolation:,} ({consolation/total_sims:.1%})")
    print(f"1-2 坏仔 (¥0): {zero:,} ({zero/total_sims:.1%})")

    print(f"\n{'=' * 60}")
    print("【结论】")
    print(f"{'=' * 60}")
    print(f"期望值：¥{ev_mc:.2f}")
    print(f"中奖概率（>=¥80）：{lucky_wins/total_sims:.1%}")
    print(f"不亏概率（>=¥5）：{(lucky_wins + bad_wins + consolation)/total_sims:.1%}")
