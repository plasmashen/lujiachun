#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
49.9 麻将欧欧乐 - 动态规划最优策略
计算在不同状态下的最优决策（继续翻牌 vs 领取奖金）
"""

from typing import List, Dict, Tuple
from collections import defaultdict
import itertools

class MahjongDP:
    def __init__(self, prizes: Dict[str, float]):
        self.prizes = prizes
        self.create_tiles()
    
    def create_tiles(self):
        """创建 64 张牌"""
        self.tiles = []
        # 字牌 28 张
        for word in ['东', '南', '西', '北', '中', '发', '白']:
            for _ in range(4):
                self.tiles.append(('word', word, 0))
        # 筒子牌 36 张
        for i, word in enumerate(['一', '二', '三', '四', '五', '六', '七', '八', '九']):
            for _ in range(4):
                self.tiles.append(('bamboo', word, i + 1))
    
    def evaluate(self, revealed: List) -> Tuple[str, float]:
        """评估牌型"""
        count = defaultdict(int)
        for t in revealed:
            key = (t[0], t[1])
            count[key] += 1
        
        values = list(count.values())
        
        # 对子
        pairs = sum(1 for c in values if c >= 2)
        if pairs >= 3:
            return ('3 对 - 大天使', self.prizes.get('3 对 - 大天使', 1450))
        if pairs >= 2:
            return ('2 对 - 小米兰', self.prizes.get('2 对 - 小米兰', 250))
        
        # 刻子
        max_count = max(values) if values else 0
        if max_count >= 4:
            return ('4 豹 - 情人节限定', self.prizes.get('4 豹 - 情人节限定', 1000))
        if max_count >= 3:
            return ('3 豹 - IGO', self.prizes.get('3 豹 - IGO', 25))
        
        # 顺子
        bamboo_nums = sorted(set(t[2] for t in revealed if t[0] == 'bamboo' and t[2] > 0))
        if len(bamboo_nums) >= 3:
            max_seq = 1
            cur_seq = 1
            for i in range(1, len(bamboo_nums)):
                if bamboo_nums[i] == bamboo_nums[i-1] + 1:
                    cur_seq += 1
                    max_seq = max(max_seq, cur_seq)
                else:
                    cur_seq = 1
            
            if max_seq >= 3:
                seq_prizes = {
                    7: ('7 顺 - 睡莲', self.prizes.get('7 顺 - 睡莲', 10000)),
                    6: ('6 顺 - 睡莲', self.prizes.get('6 顺 - 睡莲', 4000)),
                    5: ('5 顺 - 熊猫', self.prizes.get('5 顺 - 熊猫', 4000)),
                    4: ('4 顺 - 可口可乐', self.prizes.get('4 顺 - 可口可乐', 25)),
                    3: ('3 顺 - 南瓜', self.prizes.get('3 顺 - 南瓜', 330))
                }
                return seq_prizes.get(max_seq, (None, 0))
        
        # 特殊单张
        special_map = {
            '5 筒': ('马卡龙', self.prizes.get('马卡龙', 100)),
            '7 筒': ('妹宝烘培', self.prizes.get('妹宝烘培', 50)),
            '红中': ('我是大 boos', self.prizes.get('我是大 boos', 50)),
            '北风': ('我爱吃果果', self.prizes.get('我爱吃果果', 50)),
            '西风': ('MIGO', self.prizes.get('MIGO', 25)),
            '白板': ('MIGO', self.prizes.get('MIGO', 25))
        }
        for t in revealed:
            if t[0] == 'bamboo':
                label = f"{t[2]}筒"
                if label in special_map:
                    return special_map[label]
            elif t[0] == 'word':
                label_map = {'中': '红中', '北': '北风', '西': '西风', '白': '白板'}
                if t[1] in label_map:
                    label = label_map[t[1]]
                    if label in special_map:
                        return special_map[label]
        
        return (None, 0)
    
    def dp_optimal(self, revealed: List, remaining: int, balance: float, reveal_count: int) -> Tuple[str, float]:
        """
        动态规划：计算最优策略
        返回：(决策，期望收益)
        决策：'reveal' (继续翻牌) 或 'collect' (领取奖金)
        """
        # 当前最佳组合
        combo_name, current_prize = self.evaluate(revealed)
        
        # 没有剩余牌，必须领取
        if remaining == 0:
            return ('collect', current_prize)
        
        # 计算继续翻牌的费用
        next_cost = 50 if reveal_count == 0 else 10
        
        # 余额不足，必须领取
        if balance < next_cost:
            return ('collect', current_prize)
        
        # 简化 DP：估计继续翻一张牌的期望收益
        expected_gain = self.estimate_ev_gain(revealed, remaining)
        expected_net = expected_gain - next_cost
        
        # 决策
        if expected_net > 0:
            return ('reveal', current_prize + expected_net)
        else:
            return ('collect', current_prize)
    
    def estimate_ev_gain(self, revealed: List, remaining: int) -> float:
        """
        估计继续翻一张牌的期望收益
        """
        if remaining == 0:
            return 0
        
        # 统计当前牌型
        count = defaultdict(int)
        for t in revealed:
            key = (t[0], t[1])
            count[key] += 1
        
        expected_gain = 0
        
        # 1. 形成对子的期望
        for key, c in count.items():
            if c == 1:
                # 已有 1 张，再翻到 1 张形成对子
                prob = 3 / remaining
                # 假设形成对子后可能组成 2 对
                expected_gain += prob * 0.5 * self.prizes.get('2 对 - 小米兰', 250)
            elif c == 2:
                # 已有 2 张，再翻到 1 张形成刻子
                prob = 2 / remaining
                expected_gain += prob * 0.5 * self.prizes.get('3 豹 - IGO', 25)
        
        # 2. 形成顺子的期望
        bamboo_nums = sorted(set(t[2] for t in revealed if t[0] == 'bamboo' and t[2] > 0))
        for i, num in enumerate(bamboo_nums):
            # 检查是否有相邻牌
            if num + 1 not in bamboo_nums and remaining > 0:
                prob = 4 / remaining
                expected_gain += prob * 0.3 * self.prizes.get('3 顺 - 南瓜', 330)
        
        # 3. 特殊牌的期望
        special_labels = ['5 筒', '7 筒', '红中', '北风', '西风', '白板']
        has_special = any(
            (t[0] == 'bamboo' and f"{t[2]}筒" in special_labels) or
            (t[0] == 'word' and t[1] in ['中', '北', '西', '白'])
            for t in revealed
        )
        
        if not has_special and remaining > 0:
            prob = 6 / remaining
            expected_gain += prob * 50
        
        # 考虑多张牌的协同效应
        if len(revealed) >= 3:
            expected_gain *= 1.2
        if len(revealed) >= 5:
            expected_gain *= 1.5
        
        return expected_gain
    
    def simulate_optimal_game(self) -> Dict:
        """
        模拟一局使用 DP 最优策略的游戏
        """
        import random
        
        tiles = self.tiles.copy()
        random.shuffle(tiles)
        
        revealed = []
        matched = set()
        total_cost = 50  # 首次
        total_win = 0
        decisions = []
        
        # 首次翻 3 张
        revealed = list(range(3))
        reveal_count = 3
        
        max_iterations = 200
        iteration = 0
        
        while iteration < max_iterations:
            iteration += 1
            
            available = [i for i in revealed if i not in matched]
            remaining = 64 - len(revealed)
            
            if remaining == 0:
                break
            
            # DP 决策
            current_tiles = [tiles[i] for i in available]
            combo_name, current_prize = self.evaluate(current_tiles)
            
            decision, expected_value = self.dp_optimal(
                current_tiles, 
                remaining, 
                1000 - total_cost + total_win,  # 简化：假设初始 1000
                reveal_count
            )
            
            decisions.append((decision, expected_value, current_prize))
            
            if decision == 'reveal':
                # 继续翻牌
                next_cost = 50 if reveal_count == 0 else 10
                total_cost += next_cost
                revealed.append(reveal_count)
                reveal_count += 1
            else:
                # 领取奖金（简化：消除前 2 张）
                if current_prize > 0 and len(available) >= 2:
                    total_win += current_prize
                    for i in available[:2]:
                        matched.add(i)
                else:
                    # 无奖金可领，继续翻
                    next_cost = 50 if reveal_count == 0 else 10
                    total_cost += next_cost
                    revealed.append(reveal_count)
                    reveal_count += 1
            
            if len(matched) >= 64:
                break
        
        return {
            'total_cost': total_cost,
            'total_win': total_win,
            'net_profit': total_win - total_cost,
            'decisions': decisions
        }
    
    def monte_carlo_dp(self, num_simulations: int = 1000) -> Dict:
        """
        蒙特卡洛模拟 DP 最优策略
        """
        print(f"🤖 运行 DP 最优策略模拟 ({num_simulations:,} 次)...")
        
        total_cost = 0
        total_win = 0
        total_net = 0
        decision_counts = {'reveal': 0, 'collect': 0}
        
        for i in range(num_simulations):
            result = self.simulate_optimal_game()
            total_cost += result['total_cost']
            total_win += result['total_win']
            total_net += result['net_profit']
            
            for decision, _, _ in result['decisions']:
                decision_counts[decision] += 1
            
            if (i + 1) % 100 == 0:
                print(f"  进度：{i + 1:,}/{num_simulations:,}")
        
        avg_cost = total_cost / num_simulations
        avg_win = total_win / num_simulations
        avg_net = total_net / num_simulations
        
        print(f"\n✅ 模拟完成！")
        print(f"\n📊 DP 最优策略结果：")
        print("=" * 60)
        print(f"  平均成本：{avg_cost:.2f} 元")
        print(f"  平均赢取：{avg_win:.2f} 元")
        print(f"  平均净收益：{avg_net:.2f} 元")
        print(f"  RTP: {avg_win / avg_cost * 100:.2f}%" if avg_cost > 0 else "N/A")
        
        total_decisions = sum(decision_counts.values())
        print(f"\n🤖 决策分布：")
        print(f"  继续翻牌：{decision_counts['reveal']:,}次 ({decision_counts['reveal']/total_decisions*100:.1f}%)")
        print(f"  领取奖金：{decision_counts['collect']:,}次 ({decision_counts['collect']/total_decisions*100:.1f}%)")
        
        return {
            'avg_cost': avg_cost,
            'avg_win': avg_win,
            'avg_net': avg_net,
            'rtp': avg_win / avg_cost * 100 if avg_cost > 0 else 0,
            'decision_counts': decision_counts
        }


def main():
    print("=" * 60)
    print("49.9 麻将欧欧乐 - 动态规划最优策略分析")
    print("=" * 60)
    
    # 默认奖金
    prizes = {
        '3 对 - 大天使': 1450,
        '2 对 - 小米兰': 250,
        '7 顺 - 睡莲': 10000,
        '6 顺 - 睡莲': 4000,
        '5 顺 - 熊猫': 4000,
        '3 顺 - 国王象棋': 750,
        '3 顺 - 南瓜': 330,
        '4 顺 - 可口可乐': 25,
        '4 豹 - 情人节限定': 1000,
        '3 豹 - IGO': 25,
        '马卡龙': 100,
        '妹宝烘培': 50,
        '我是大 boos': 50,
        '我爱吃果果': 50,
        'MIGO': 25
    }
    
    dp = MahjongDP(prizes)
    
    # 运行模拟
    results = dp.monte_carlo_dp(1000)
    
    # 不同奖金倍率下的 DP 结果
    print(f"\n\n🎯 不同奖金设置下的 DP 最优策略：")
    print("=" * 60)
    
    multipliers = [0.5, 1.0, 1.5, 2.0, 3.0]
    for mult in multipliers:
        test_prizes = {k: v * mult for k, v in prizes.items()}
        dp_test = MahjongDP(test_prizes)
        result = dp_test.monte_carlo_dp(500)
        print(f"\n  倍率 {mult}x: 期望净收益 = {result['avg_net']:.2f}元, RTP = {result['rtp']:.1f}%")


if __name__ == '__main__':
    main()
