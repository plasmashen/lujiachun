#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
49.9 麻将欧欧乐 - 蒙特卡洛概率模拟
计算各牌型出现概率和期望值
"""

import random
import itertools
from collections import defaultdict
from typing import List, Dict, Tuple
import json

class MahjongSimulator:
    def __init__(self):
        self.tiles = []
        self.create_tiles()
        
    def create_tiles(self):
        """创建 64 张牌"""
        self.tiles = []
        
        # 字牌 28 张：东南西北中发白（每种 4 张）
        word_tiles = ['东', '南', '西', '北', '中', '发', '白']
        for tile in word_tiles:
            for _ in range(4):
                self.tiles.append(('word', tile))
        
        # 筒子牌 36 张：一筒到九筒（每种 4 张）
        bamboo_tiles = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
        for i, tile in enumerate(bamboo_tiles):
            for _ in range(4):
                self.tiles.append(('bamboo', tile, i + 1))  # 添加数字用于顺子判断
    
    def shuffle(self) -> List:
        """洗牌并返回"""
        tiles = self.tiles.copy()
        random.shuffle(tiles)
        return tiles
    
    def check_pair(self, revealed: List) -> int:
        """检查对子数量"""
        count = defaultdict(int)
        for tile in revealed:
            key = (tile[0], tile[1])  # type 和 value
            count[key] += 1
        pairs = sum(1 for c in count.values() if c >= 2)
        return pairs
    
    def check_triplet(self, revealed: List) -> int:
        """检查刻子（豹子）"""
        count = defaultdict(int)
        for tile in revealed:
            key = (tile[0], tile[1])
            count[key] += 1
        triplets = [(k, c) for k, c in count.items() if c >= 3]
        if not triplets:
            return 0
        return max(c for _, c in triplets)
    
    def check_sequence(self, revealed: List) -> int:
        """检查顺子（最长连续）"""
        bamboo = [t[2] for t in revealed if t[0] == 'bamboo' and len(t) > 2]
        if len(bamboo) < 3:
            return 0
        
        bamboo = sorted(set(bamboo))
        max_seq = 1
        current_seq = 1
        
        for i in range(1, len(bamboo)):
            if bamboo[i] == bamboo[i-1] + 1:
                current_seq += 1
                max_seq = max(max_seq, current_seq)
            else:
                current_seq = 1
        
        return max_seq if max_seq >= 3 else 0
    
    def check_special_tile(self, revealed: List) -> str:
        """检查特殊单张"""
        special = {
            '5筒': '马卡龙',
            '7筒': '妹宝烘培',
            '红中': '我是大 boos',
            '北风': '我爱吃果果',
            '西风': 'MIGO',
            '白板': 'MIGO'
        }
        for tile in revealed:
            if tile[0] == 'bamboo' and len(tile) > 2:
                label = f"{tile[2]}筒"
                if label in special:
                    return special[label]
            elif tile[0] == 'word':
                label_map = {'中': '红中', '北': '北风', '西': '西风', '白': '白板'}
                if tile[1] in label_map:
                    return special.get(label_map[tile[1]])
        return None
    
    def evaluate_hand(self, revealed: List) -> Tuple[str, float]:
        """评估手牌，返回最佳牌型和分数"""
        best_combo = None
        best_score = 0
        
        # 检查对子
        pairs = self.check_pair(revealed)
        if pairs >= 3:
            if 145 > best_score:
                best_combo = '3 对 - 大天使'
                best_score = 145
        elif pairs >= 2:
            if 25 > best_score:
                best_combo = '2 对 - 小米兰'
                best_score = 25
        
        # 检查刻子
        triplet_max = self.check_triplet(revealed)
        if triplet_max >= 4:
            if 100 > best_score:
                best_combo = '4 豹 - 情人节限定'
                best_score = 100
        elif triplet_max >= 3:
            if 2.5 > best_score:
                best_combo = '3 豹 - IGO'
                best_score = 2.5
        
        # 检查顺子
        seq_len = self.check_sequence(revealed)
        if seq_len >= 3:
            seq_scores = {
                7: ('7 顺 - 睡莲', 1000),
                6: ('6 顺 - 睡莲', 400),
                5: ('5 顺 - 熊猫', 400),
                4: ('4 顺 - 可口可乐', 2.5),
                3: ('3 顺 - 南瓜', 33)
            }
            combo, score = seq_scores.get(seq_len, (None, 0))
            if score > best_score:
                best_combo = combo
                best_score = score
        
        # 检查特殊单张（如果还没有更好的组合）
        if best_score < 10:
            special = self.check_special_tile(revealed)
            if special:
                special_scores = {
                    '马卡龙': 10,
                    '妹宝烘培': 5,
                    '我是大 boos': 5,
                    '我爱吃果果': 5,
                    'MIGO': 2.5
                }
                score = special_scores.get(special, 0)
                if score > best_score:
                    best_combo = special
                    best_score = score
        
        return (best_combo, best_score) if best_combo else (None, 0)
    
    def simulate_game(self, reveal_strategy: str = 'optimal') -> Dict:
        """
        模拟一局游戏
        返回：{total_cost, total_win, combos, final_combo_probs}
        """
        tiles = self.shuffle()
        revealed = []
        total_cost = 50  # 首次 50 元看 3 张
        total_win = 0
        combos = []
        matched = set()
        
        # 首次看 3 张
        revealed = list(range(3))
        reveal_count = 3
        
        while True:
            # 获取当前已翻开未匹配的牌
            available = [i for i in revealed if i not in matched]
            
            if len(available) < 2:
                # 没有足够的牌可以组合，继续看牌
                if reveal_count >= 64:
                    break
                
                # 计算看牌费用
                if reveal_count == 3:
                    cost = 50  # 首次
                else:
                    cost = 10  # 后续每张
                
                if reveal_count + 1 > 64:
                    break
                    
                total_cost += cost
                revealed.append(reveal_count)
                reveal_count += 1
                continue
            
            # 尝试找组合
            available_tiles = [tiles[i] for i in available]
            combo, score = self.evaluate_hand(available_tiles)
            
            if combo:
                # 找到组合，消除
                combos.append((combo, score))
                total_win += score * 10  # 10 倍奖金
                
                # 简单策略：消除参与组合的牌（这里简化为消除前几张）
                # 实际应该追踪哪些牌参与了组合
                for i in available[:2]:  # 简化：每次消除 2 张
                    matched.add(i)
            else:
                # 没有找到组合，继续看牌
                if reveal_count >= 64:
                    break
                
                cost = 10
                total_cost += cost
                revealed.append(reveal_count)
                reveal_count += 1
            
            # 检查是否所有牌都匹配了
            if len(matched) >= 64:
                break
            
            # 防止无限循环
            if len(combos) > 30:
                break
        
        return {
            'total_cost': total_cost,
            'total_win': total_win,
            'net_profit': total_win - total_cost,
            'combos': combos
        }
    
    def monte_carlo(self, num_simulations: int = 10000) -> Dict:
        """
        蒙特卡洛模拟
        """
        combo_counts = defaultdict(int)
        combo_scores = defaultdict(float)
        results = []
        
        print(f"🎲 开始蒙特卡洛模拟 ({num_simulations:,} 次)...")
        
        for i in range(num_simulations):
            result = self.simulate_game()
            results.append(result)
            
            for combo, score in result['combos']:
                combo_counts[combo] += 1
                combo_scores[combo] += score
            
            if (i + 1) % 1000 == 0:
                print(f"  进度：{i + 1:,}/{num_simulations:,} ({(i+1)/num_simulations*100:.1f}%)")
        
        # 计算概率
        total_games = len(results)
        total_combos = sum(combo_counts.values())
        
        print(f"\n✅ 模拟完成！共 {total_games:,} 局游戏")
        
        # 统计结果
        stats = {
            'total_simulations': total_games,
            'total_combos_found': total_combos,
            'avg_cost': sum(r['total_cost'] for r in results) / total_games,
            'avg_win': sum(r['total_win'] for r in results) / total_games,
            'avg_net_profit': sum(r['net_profit'] for r in results) / total_games,
            'win_rate': sum(1 for r in results if r['net_profit'] > 0) / total_games,
            'combo_probs': {}
        }
        
        # 各牌型概率（按出现次数）
        print("\n📊 各牌型出现概率：")
        print("-" * 60)
        for combo in sorted(combo_counts.keys(), key=lambda x: -combo_counts[x]):
            count = combo_counts[combo]
            prob_per_game = count / total_games  # 每局平均出现次数
            prob_per_combo = count / total_combos if total_combos > 0 else 0  # 占所有组合的比例
            avg_score = combo_scores[combo] / count if count > 0 else 0
            print(f"  {combo:15s}: {count:6,}次 ({prob_per_game:.4f}次/局)  平均分:{avg_score:.2f}")
            stats['combo_probs'][combo] = {
                'count': count,
                'prob_per_game': prob_per_game,
                'prob_per_combo': prob_per_combo,
                'avg_score': avg_score
            }
        
        # 计算期望值
        print("\n💰 期望值分析：")
        print("-" * 60)
        print(f"  平均成本：{stats['avg_cost']:.2f} 元")
        print(f"  平均赢取：{stats['avg_win']:.2f} 元")
        print(f"  平均净收益：{stats['avg_net_profit']:.2f} 元")
        print(f"  胜率：{stats['win_rate']*100:.2f}%")
        
        # 计算庄家优势
        if stats['avg_cost'] > 0:
            house_edge = -stats['avg_net_profit'] / stats['avg_cost'] * 100
            print(f"  庄家优势：{house_edge:.2f}%")
        
        return stats
    
    def calculate_expected_value(self, prize_multipliers: Dict[str, float]) -> Dict:
        """
        根据自定义奖金倍率计算期望值
        prize_multipliers: {牌型名称：奖金倍率}
        """
        # 先跑一次基础模拟获取概率
        stats = self.monte_carlo(5000)
        
        print("\n\n🎯 自定义奖金期望计算：")
        print("-" * 60)
        
        expected_win_per_game = 0
        for combo, data in stats['combo_probs'].items():
            # 查找用户自定义的倍率，如果没有则用默认 10 倍
            multiplier = prize_multipliers.get(combo, 10)
            expected_score = data['avg_score'] * data['prob_per_game']
            expected_win = expected_score * multiplier
            expected_win_per_game += expected_win
            
            print(f"  {combo:15s}: 概率={data['prob_per_game']:.4f}  期望贡献={expected_win:.2f}元")
        
        avg_cost = stats['avg_cost']
        expected_net = expected_win_per_game - avg_cost
        
        print("\n" + "=" * 60)
        print(f"  平均成本：{avg_cost:.2f} 元")
        print(f"  期望赢取：{expected_win_per_game:.2f} 元")
        print(f"  期望净收益：{expected_net:.2f} 元")
        
        if avg_cost > 0:
            rtp = expected_win_per_game / avg_cost * 100
            house_edge = (1 - rtp / 100) * 100
            print(f"  RTP(返奖率): {rtp:.2f}%")
            print(f"  庄家优势：{house_edge:.2f}%")
        
        # 公平游戏建议
        if expected_net < 0:
            fair_multiplier = avg_cost / expected_win_per_game * 10 if expected_win_per_game > 0 else 10
            print(f"\n💡 建议：要使游戏公平，奖金倍率应调整为 {fair_multiplier:.2f}x")
        
        return {
            'expected_win': expected_win_per_game,
            'expected_cost': avg_cost,
            'expected_net': expected_net,
            'rtp': expected_win_per_game / avg_cost * 100 if avg_cost > 0 else 0
        }


def main():
    sim = MahjongSimulator()
    
    print("=" * 60)
    print("49.9 麻将欧欧乐 - 蒙特卡洛概率模拟")
    print("=" * 60)
    
    # 运行蒙特卡洛模拟
    stats = sim.monte_carlo(10000)
    
    # 计算不同奖金倍率下的期望
    print("\n\n" + "=" * 60)
    print("不同奖金倍率下的期望值对比")
    print("=" * 60)
    
    multipliers = [5, 8, 10, 12, 15, 20]
    for mult in multipliers:
        prize_config = {combo: mult for combo in stats['combo_probs'].keys()}
        ev = sim.calculate_expected_value(prize_config)
        print(f"\n  奖金倍率 {mult}x: 期望净收益 = {ev['expected_net']:.2f}元, RTP = {ev['rtp']:.2f}%")
    
    # 保存结果到 JSON
    with open('monte_carlo_results.json', 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    print("\n📁 结果已保存到 monte_carlo_results.json")


if __name__ == '__main__':
    main()
