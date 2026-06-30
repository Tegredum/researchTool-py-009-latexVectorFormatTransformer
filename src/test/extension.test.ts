import * as assert from 'assert';

import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('扩展应已注册所有命令', async () => {
		const allCommands = await vscode.commands.getCommands(true);
		const extensionCommands = allCommands.filter(cmd => cmd.startsWith('latexVectorFormatTransformer.'));
		assert.ok(extensionCommands.includes('latexVectorFormatTransformer.convertDocument'), '缺少 convertDocument 命令');
		assert.ok(extensionCommands.includes('latexVectorFormatTransformer.convertAndPaste'), '缺少 convertAndPaste 命令');
	});

	test('扩展配置项应已声明', () => {
		const config = vscode.workspace.getConfiguration('latexVectorFormatTransformer');
		assert.notStrictEqual(config, undefined, '配置节点不存在');
	});
});
