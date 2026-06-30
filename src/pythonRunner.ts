// encoding: utf-8
// author: TRAE Work CN

import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';

export type PythonMode = 'auto' | 'direct' | 'conda';

export interface PythonRunnerConfig {
	mode: PythonMode;
	pythonPath: string;
	condaPath: string;
	condaEnv: string;
}

export class PythonRunner {
	private context: vscode.ExtensionContext;
	private scriptPath: string;
	private cachedCommand: string | undefined;
	private cachedArgs: string[] | undefined;
	private cachedMode: PythonMode | undefined;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.scriptPath = context.asAbsolutePath(path.join('src', 'latexVecFormatConverter.py'));
	}

	private getConfig(): PythonRunnerConfig {
		const config = vscode.workspace.getConfiguration('latexVectorFormatTransformer');
		return {
			mode: config.get<PythonMode>('pythonMode', 'auto'),
			pythonPath: config.get<string>('pythonPath', 'python'),
			condaPath: config.get<string>('condaPath', 'conda'),
			condaEnv: config.get<string>('condaEnv', ''),
		};
	}

	private buildCommand(config: PythonRunnerConfig, mode: PythonMode): { command: string; args: string[] } {
		if (mode === 'direct') {
			return {
				command: config.pythonPath,
				args: [this.scriptPath],
			};
		} else {
			const envName = config.condaEnv || 'base';
			return {
				command: config.condaPath,
				args: ['run', '-n', envName, 'python', this.scriptPath],
			};
		}
	}

	private async testPython(command: string, args: string[]): Promise<boolean> {
		return new Promise((resolve) => {
			const process = spawn(command, [...args, '--help'], {
				stdio: ['ignore', 'ignore', 'ignore'],
			});
			process.on('error', () => resolve(false));
			process.on('exit', (code) => resolve(code === 0));
		});
	}

	private async detectEnvironment(config: PythonRunnerConfig): Promise<{ command: string; args: string[]; mode: PythonMode }> {
		if (config.mode === 'direct') {
			const { command, args } = this.buildCommand(config, 'direct');
			if (await this.testPython(command, args)) {
				return { command, args, mode: 'direct' };
			}
			throw new Error(`Python 直接模式失败: 无法执行 ${command}`);
		}

		if (config.mode === 'conda') {
			const { command, args } = this.buildCommand(config, 'conda');
			if (await this.testPython(command, args)) {
				return { command, args, mode: 'conda' };
			}
			throw new Error(`Conda 模式失败: 无法执行 ${command}`);
		}

		const directCmd = this.buildCommand(config, 'direct');
		if (await this.testPython(directCmd.command, directCmd.args)) {
			return { command: directCmd.command, args: directCmd.args, mode: 'direct' };
		}

		const condaCmd = this.buildCommand(config, 'conda');
		if (await this.testPython(condaCmd.command, condaCmd.args)) {
			return { command: condaCmd.command, args: condaCmd.args, mode: 'conda' };
		}

		throw new Error('自动检测失败: direct 和 conda 模式均无法正常工作');
	}

	private async ensureEnvironment(): Promise<{ command: string; args: string[]; mode: PythonMode }> {
		const config = this.getConfig();

		if (this.cachedCommand && this.cachedArgs && this.cachedMode === config.mode) {
			return { command: this.cachedCommand, args: this.cachedArgs, mode: config.mode };
		}

		const result = await this.detectEnvironment(config);
		this.cachedCommand = result.command;
		this.cachedArgs = result.args;
		this.cachedMode = config.mode;

		return result;
	}

	public async convertText(text: string): Promise<string> {
		const { command, args, mode } = await this.ensureEnvironment();

		return new Promise((resolve, reject) => {
			const process = spawn(command, args, {
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			let stdout = '';
			let stderr = '';

			process.stdout.on('data', (data) => {
				stdout += data.toString();
			});

			process.stderr.on('data', (data) => {
				stderr += data.toString();
			});

			process.on('error', (err) => {
				reject(new Error(`Python 执行失败 (${mode} 模式): ${err.message}`));
			});

			process.on('exit', (code) => {
				if (code === 0) {
					resolve(stdout);
				} else {
					const errorMsg = stderr || '无错误输出';
					reject(new Error(`Python 脚本执行失败 (${mode} 模式)，退出码: ${code}\n错误信息: ${errorMsg}`));
				}
			});

			process.stdin.write(text);
			process.stdin.end();
		});
	}

	public resetCache(): void {
		this.cachedCommand = undefined;
		this.cachedArgs = undefined;
		this.cachedMode = undefined;
	}
}
