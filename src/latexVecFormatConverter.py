# encoding: utf-8
# author: kimi-k2-thinking, Tegredum, TRAE Work CN
# python version: 3.10.16

import re
import sys
import argparse

def replace_latex_delimiters_and_commands(text: str) -> str:
	# 处理 LaTeX 格式的字符串：
	# 1. 找出所有被 \[ 和 \] 包围的部分
	# 2. 将包围符号 \[ 和 \] 替换为 $$
	# 3. 在被包围的部分内，将 \bf 命令替换为 \bm
	
	# 参数:
	# 	text: 输入的字符串，包含 LaTeX 格式的数学公式
		
	# 返回:
	# 	处理后的字符串
	
	# 正则表达式匹配 \[ ... \] 结构
	# 使用非贪婪模式 .*? 确保匹配最短可能，避免跨越多个公式块
	# re.DOTALL 标志使 . 能匹配包括换行符在内的任意字符，支持多行公式
	pattern = r'\\\[.*?\\\]'
	
	def replacement_function(match):
		# 获取匹配的完整内容
		matched_string = match.group(0)
		
		# 提取内部内容（去掉开头的 \[ 和结尾的 \]）
		# matched_string 以两个字符的 \[ 开始，以两个字符的 \] 结束
		inner_content = matched_string[2:-2]
		
		# 在内部内容中将 \bf 替换为 \bm
		# 使用正则表达式确保精确匹配，避免错误替换 \bfseries 等其他命令
		# (?![a-zA-Z]) 是负向前瞻，确保 \bf 后面不是字母
		inner_content = re.sub(r'\\bf(?![a-zA-Z])', r'\\bm', inner_content)
		
		# 返回新的格式：$$ + 处理后的内容 + $$
		return f'$${inner_content}$$'
	
	# 执行全局替换
	result = re.sub(pattern, replacement_function, text, flags=re.DOTALL)
	return result


def main():
	parser = argparse.ArgumentParser(description='LaTeX 向量格式转换器：将 \\[...\\] 转换为 $$...$$，并将 \\bf 替换为 \\bm')
	parser.add_argument('--input', '-i', type=str, help='输入文件路径')
	parser.add_argument('--output', '-o', type=str, help='输出文件路径')
	args = parser.parse_args()
	
	if args.input:
		with open(args.input, 'r', encoding='utf-8') as f:
			text = f.read()
	else:
		text = sys.stdin.read()
	
	result = replace_latex_delimiters_and_commands(text)
	
	if args.output:
		with open(args.output, 'w', encoding='utf-8') as f:
			f.write(result)
	else:
		sys.stdout.write(result)

def run_tests():
	# 测试 1: 简单情况
	test1 = r"这是一个 \[ \bf{重要公式} \] 示例"
	print("测试 1:")
	print(f"输入: {test1}")
	print(f"输出: {replace_latex_delimiters_and_commands(test1)}")
	print()
	
	# 测试 2: 多个公式块
	test2 = r"第一段 \[ \bf{公式1} \] 和第二段 \[ 普通公式 \] 结束"
	print("测试 2:")
	print(f"输入: {test2}")
	print(f"输出: {replace_latex_delimiters_and_commands(test2)}")
	print()
	
	# 测试 3: 包含换行符的多行公式
	test3 = r"""这是一个多行公式：
\[
\bf{a} = b + c \\
d = e + f
\]"""
	print("测试 3:")
	print(f"输入: {test3}")
	print(f"输出: {replace_latex_delimiters_and_commands(test3)}")
	print()
	
	# 测试 4: 没有匹配的情况
	test4 = "这是一个普通文本，没有特殊格式"
	print("测试 4:")
	print(f"输入: {test4}")
	print(f"输出: {replace_latex_delimiters_and_commands(test4)}")
	print()
	
	# 测试 5: 嵌套替换（多个 \bf）和精确匹配
	test5 = r"\[ \bf{a} + \bf{b} = \bfseries{c} \]"
	print("测试 5:")
	print(f"输入: {test5}")
	print(f"输出: {replace_latex_delimiters_and_commands(test5)}")
	print("注意：\\bfseries 没有被错误替换")
	print()
	
	# 测试 6: 空公式块
	test6 = r"文本 \[ \] 更多文本"
	print("测试 6:")
	print(f"输入: {test6}")
	print(f"输出: {replace_latex_delimiters_and_commands(test6)}")
	print()

if __name__ == "__main__":
	main()
