#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的文本嵌入相似度测试
使用智谱AI embedding模型计算文本之间的语义相似度
"""

import numpy as np
import argparse
from settings import create_client

# OpenAI 客户端配置（通过环境变量）
client = create_client()


def get_embedding(text, model="embedding-3"): #"text-embedding-3-large"):
    """获取文本嵌入向量"""
    text = text.replace("\n", " ")
    return client.embeddings.create(input=[text], model=model).data[0].embedding


def cosine_similarity(vec1, vec2):
    """计算余弦相似度"""
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))


def normalize_phrase_list(phrases):
    """支持空格分隔输入，并自动去掉输入里的 * 和 /。"""
    normalized = []
    for item in phrases:
        cleaned_item = item.replace("*", " ").replace("/", " ").replace("、", " ").replace("|", " ").replace("。", " ").replace("？", " ".replace("，", " "))
        normalized.extend(part for part in cleaned_item.split() if part)
    return normalized


def compare_texts(text1, text2, text3=None):
    """
    比较文本之间的相似度

    Args:
        text1: 文本1
        text2: 文本2
        text3: 文本3（可选）
    """
    print("=" * 60)
    print("文本相似度测试")
    print("=" * 60)

    # 获取嵌入向量
    print("\n正在获取嵌入向量...")
    vec1 = get_embedding(text1)
    vec2 = get_embedding(text2)

    # 计算相似度
    sim_12 = cosine_similarity(vec1, vec2)

    if not text3:
        print(f"\n{text1} vs {text2}")
        print(f"相似度: {sim_12:.4f}")

    # 如果有第三个文本，计算更多相似度
    if text3:
        vec3 = get_embedding(text3)
        sim_13 = cosine_similarity(vec1, vec3)
        sim_23 = cosine_similarity(vec2, vec3)

        #print(f"\n第三个短语: {text3}")
        print(f"\n相似度矩阵:")
        print(f"  {text1} vs {text2}: {sim_12:.4f}")
        print(f"  {text1} vs {text3}: {sim_13:.4f}")
        print(f"  {text2} vs {text3}: {sim_23:.4f}")

        # 找出最相似的一对
        sims = [("1-2", sim_12), ("1-3", sim_13), ("2-3", sim_23)]
        max_pair = max(sims, key=lambda x: x[1])
        print(f"\n最相似的一对: {max_pair[0]} ({max_pair[1]:.4f})")

    return sim_12


def test_hexagram_yaoci():
    """测试短语相似性矩阵，并多次运行取平均"""
    print("\n" + "=" * 60)
    print("测试5: 相似性矩阵")
    print("=" * 60)
        

    qian_phrases = ["扰乱 搅浑"]
    yu_phrases = ["交往 放纵"]

    #qian_phrases = ["温故知新/继往开来/兼容并包/瓜熟蒂落/贞而不谅"]
    #yu_phrases = [ "剃发易服/甘棠遗爱/政通人和/深得民心/洗心革面"]
    #超过：月亮达到望月，马与鸭子狂乱（发春，借助与自然相符有所超过，来互相匹配）。 近义词成语

    qian_phrases = normalize_phrase_list(qian_phrases)
    yu_phrases = normalize_phrase_list(yu_phrases)

    all_runs = []
    #for run_idx in range(repeats):
    print(f"\n第 {1} 次运行...")
    qian_embeddings = [get_embedding(text) for text in qian_phrases]
    yu_embeddings = [get_embedding(text) for text in yu_phrases]

    run_matrix = np.zeros((len(qian_phrases), len(yu_phrases)))
    for i, qian_vec in enumerate(qian_embeddings):
        for j, yu_vec in enumerate(yu_embeddings):
            run_matrix[i, j] = cosine_similarity(qian_vec, yu_vec)
    all_runs.append(run_matrix)

    all_runs = np.array(all_runs)
    mean_matrix = np.mean(all_runs, axis=0)
    std_matrix = np.std(all_runs, axis=0)

    print("\n平均相似性矩阵 (2 x 5):")
    print("行=谦短语, 列=豫短语 (*表示超过0.55)")
    print(" " * 12 + " | " + " | ".join([f"{p:>8}" for p in yu_phrases]))
    print("-" * 80)
    for i, phrase in enumerate(qian_phrases):
        values = " | ".join([f"{mean_matrix[i, j]:8.4f}{'*' if mean_matrix[i, j] > 0.6 else ' '}" for j in range(len(yu_phrases))]) # 0.3 if gpt
        print(f"{phrase:>10} | {values}")

    # 检查矩阵格子数是否 >= 20，输出超过0.55的最大5个相似性
    matrix_size = mean_matrix.shape[0] * mean_matrix.shape[1]
    if matrix_size >= 20:
        print("\n" + "=" * 60)
        print(f"矩阵格子数 >= 20 ({matrix_size} 个格子)")
        print("查找超过 0.55 的最大 5 个相似性...")
        print("=" * 60)

        # 找出所有超过 0.55 的相似性及其坐标
        high_sim_pairs = []
        for i in range(mean_matrix.shape[0]):
            for j in range(mean_matrix.shape[1]):
                sim_value = mean_matrix[i, j]
                if sim_value > 0.55:
                    high_sim_pairs.append({
                        'similarity': sim_value,
                        'row_idx': i,
                        'col_idx': j,
                        'row_phrase': qian_phrases[i],
                        'col_phrase': yu_phrases[j]
                    })

        # 按相似性降序排序，取前5个
        high_sim_pairs.sort(key=lambda x: x['similarity'], reverse=True)
        top_5 = high_sim_pairs[:5]

        if top_5:
            print(f"\n找到 {len(high_sim_pairs)} 个超过 0.55 的相似性对")
            print("前 5 个最高相似性对:")
            print("-" * 80)
            for rank, pair in enumerate(top_5, 1):
                print(f"{rank}. 相似度: {pair['similarity']:.4f}, 横坐标 (行 {pair['row_idx']}): {pair['row_phrase']}, 纵坐标 (列 {pair['col_idx']}): {pair['col_phrase']}")
        else:
            print("\n没有找到超过 0.55 的相似性对")



def main():
    """运行所有测试"""
    parser = argparse.ArgumentParser(description="Embedding similarity quick test")
    parser.add_argument("--text1", type=str, help="First text")
    parser.add_argument("--text2", type=str, help="Second text")
    parser.add_argument("--text3", type=str, default=None, help="Optional third text")
    args = parser.parse_args()

    print("\n" + "#" * 60)
    print("# 简单嵌入相似度测试")
    print("#" * 60)

    if args.text1 and args.text2:
        compare_texts(args.text1, args.text2, args.text3)
    else:
        # 保留下列 compare_texts 三参数用法示例
        compare_texts(
            "取悦",
            "逊色",
            "具备"
        )
        test_hexagram_yaoci()

    print("\n" + "#" * 60)
    print("# 测试完成!")
    print("#" * 60)


if __name__ == "__main__":
    main()
