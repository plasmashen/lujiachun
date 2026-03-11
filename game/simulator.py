#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
49.9 麻将欧欧乐 - 蒙特卡洛概率模拟器
10,000 次模拟统计各牌型出现概率
"""

import random
from collections import defaultdict
from typing import List, Dict, Tuple

class MahjongSimulator:
    def __init__(self):
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
    
    def shuffle(self) -> List:
        """洗牌"""
        tiles = self.tiles.copy()
        random.shuffle(tiles)
        return tiles
    
    def evaluate(self, revealed: List) -> Tuple[str, float]:
        """评估牌型，返回 (牌型名称，分数)"""
        # 统计牌型
        count = defaultdict(int)
        for t in revealed:
            key = (t[0], t[1])
            count[key] += 1
        
        values = list(count.values())
        
        # 对子
        pairs = sum(1 for c in values if c >= 2)
        if pairs >= 3:
            return ('3 对 - 大天使', 145)
        if pairs >= 2:
            return ('2 对 - 小米兰', 25)
        
        # 刻子
        max_count = max(values) if values else 0
        if max_count >= 4:
            return ('4 豹 - 情人节限定', 100)
        if max_count >= 3:
            return ('3 豹 - IGO', 2.5)
        
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
                seq_scores = {
                    7: ('7 顺 - 睡莲', 1000),
                    6: ('6 顺 - 睡莲', 400),
                    5: ('5 顺 - 熊猫', 400),
                    4: ('4 顺 - 可口可乐', 2.5),
                    3: ('3 顺 - 南瓜', 33)
                }
                return seq_scores.get(max_seq, (None, 0))
        
        # 特殊单张
        special_map = {
            '5 筒': ('马卡龙', 10),
            '7 筒': ('妹宝烘培', 5),
            '红中': ('我是大 boos', 5),
            '北风': ('我爱吃果果', 5),
            '西风': ('MIGO', 2.5),
            '白板': ('MIGO', 2.5)
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
    
    def simulate_game(self) -> Dict:
        """模拟一局游戏"""
        tiles = self.shuffle()
        revealed = []
        total_cost = 50  # 首次 50 元看 3 张
        combos = []
        matched = set()
        
        # 首次看 3 张
        revealed = list(range(3))
        reveal_count = 3
        
        max_iterations = 200
        iteration = 0
        
        while iteration < max_iterations:
            iteration += 1
            
            # 获取已翻开未匹配的牌
            available = [i for i in revealed if i not in matched]
            
            if len(available) < 2:
                # 继续看牌
                if reveal_count >= 64:
                    break
                cost = 50 if reveal_count == 3 else 10
                total_cost += cost
                revealed.append(reveal_count)
                reveal_count += 1
                continue
            
            # 评估牌型
            available_tiles = [tiles[i] for i in available]
            combo_name, score = self.evaluate(available_tiles)
            
            if combo_name:
                combos.append((combo_name, score))
                # 简化：消除前 2 张
                for i in available[:2]:
                    matched.add(i)
            else:
                # 继续看牌
                if reveal_count >= 64:
                    break
                total_cost += 10
                revealed.append(reveal_count)
                reveal_count += 1
            
            if len(matched) >= 64:
                break
        
        return {
            'total_cost': total_cost,
            'combos': combos,
            'total_score': sum(s for _, s in combos)
        }
    
    def monte_carlo(self, num_simulations: int = 10000) -> Dict:
        """蒙特卡洛模拟"""
        combo_counts = defaultdict(int)
        combo_scores = defaultdict(float)
        cost_sum = 0
        score_sum = 0
        
        print(f"🎲 开始蒙特卡洛模拟 ({num_simulations:,} 次)...")
        
        for i in range(num_simulations):
            result = self.simulate_game()
            cost_sum += result['total_cost']
            score_sum += result['total_score']
            
            for name, score in result['combos']:
                combo_counts[name] += 1
                combo_scores[name] += score
            
            if (i + 1) % 1000 == 0:
                print(f"  进度：{i + 1:,}/{num_simulations:,} ({(i+1)/num_simulations*100:.1f}%)")
        
        # 计算概率
        total_combos = sum(combo_counts.values())
        
        print(f"\n✅ 模拟完成！共 {num_simulations:,} 局")
        print(f"\n📊 各牌型出现概率（每局平均次数）：")
        print("=" * 70)
        
        results = []
        for name in sorted(combo_counts.keys(), key=lambda x: -combo_counts[x]):
            count = combo_counts[name]
            prob_per_game = count / num_simulations
            avg_score = combo_scores[name] / count if count > 0 else 0
            results.append({
                'name': name,
                'count': count,
                'prob': prob_per_game,
                'avg_score': avg_score
            })
            print(f"  {name:15s}: {prob_per_game:.4f} 次/局  (共{count:,}次)  均分:{avg_score:.2f}")
        
        # 期望值
        avg_cost = cost_sum / num_simulations
        avg_score = score_sum / num_simulations
        
        print(f"\n💰 期望值分析（默认 10 倍率）：")
        print("=" * 70)
        print(f"  平均成本：{avg_cost:.2f} 元")
        print(f"  平均分数：{avg_score:.2f} 分")
        print(f"  期望赢取：{avg_score * 10:.2f} 元")
        print(f"  期望净收益：{avg_score * 10 - avg_cost:.2f} 元")
        
        # 不同倍率下的期望
        print(f"\n🎯 不同奖金倍率下的期望：")
        print("=" * 70)
        for mult in [3, 3.6, 4, 5, 8, 10]:
            expected_win = avg_score * mult
            net = expected_win - avg_cost
            rtp = (expected_win / avg_cost * 100) if avg_cost > 0 else 0
            print(f"  {mult:4.1f}x 倍率：期望赢取={expected_win:7.2f}元  净收益={net:7.2f}元  RTP={rtp:5.1f}%")
        
        # 公平倍率
        fair_mult = avg_cost / avg_score if avg_score > 0 else 0
        print(f"\n💡 公平游戏建议：")
        print("=" * 70)
        print(f"  公平倍率：{fair_mult:.2f}x (使 RTP=100%)")
        print(f"  庄家 5% 优势：{fair_mult * 0.95:.2f}x")
        print(f"  庄家 10% 优势：{fair_mult * 0.90:.2f}x")
        
        return {
            'num_simulations': num_simulations,
            'avg_cost': avg_cost,
            'avg_score': avg_score,
            'fair_multiplier': fair_mult,
            'combo_probs': results
        }


def main():
    print("=" * 70)
    print("49.9 麻将欧欧乐 - 蒙特卡洛概率模拟")
    print("=" * 70)
    print()
    
    sim = MahjongSimulator()
    results = sim.monte_carlo(10000)
    
    # 保存结果
    import json
    with open('simulation_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"\n📁 结果已保存到 simulation_results.json")


if __name__ == '__main__':
    main()
