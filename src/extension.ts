import * as vscode from 'vscode';
import { PythonRunner } from './pythonRunner';

export function activate(context: vscode.ExtensionContext) {
	const runner = new PythonRunner(context);

	const convertDocument = vscode.commands.registerCommand('latexVectorFormatTransformer.convertDocument', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('没有活动的编辑器');
			return;
		}

		const document = editor.document;
		const selection = editor.selection;
		const hasSelection = !selection.isEmpty;
		const textToConvert = hasSelection ? document.getText(selection) : document.getText();

		try {
			const converted = await runner.convertText(textToConvert);
			const range = hasSelection ? selection : new vscode.Range(
				document.positionAt(0),
				document.positionAt(textToConvert.length)
			);
			await editor.edit(editBuilder => {
				editBuilder.replace(range, converted);
			});
			vscode.window.showInformationMessage(hasSelection ? '已转换选中内容' : '已转换整个文档');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`转换失败: ${errorMessage}`);
		}
	});

	const convertAndPaste = vscode.commands.registerCommand('latexVectorFormatTransformer.convertAndPaste', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('没有活动的编辑器');
			return;
		}

		try {
			const clipboardText = await vscode.env.clipboard.readText();
			if (!clipboardText) {
				vscode.window.showWarningMessage('剪贴板为空');
				return;
			}
			const converted = await runner.convertText(clipboardText);
			const position = editor.selection.active;
			await editor.edit(editBuilder => {
				editBuilder.insert(position, converted);
			});
			vscode.window.showInformationMessage('已转换并粘贴');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`转换失败: ${errorMessage}`);
		}
	});

	context.subscriptions.push(convertDocument, convertAndPaste);
}

export function deactivate() {}
