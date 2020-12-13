'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { window, Position } from 'vscode';

function camelize(text) {
  text = text.replace(/[-_\s.]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  return text.substr(0, 1).toLowerCase() + text.substr(1);
}

function getStylesObjectStr(styleText, quoteType) {
  const styleObjStr = styleText.replace(new RegExp('.*', 'g'), function (line) {
    let match;
    if (quoteType === 'double') {
      match = line.match(new RegExp('(.*)(style=(".*?"))(.*)'))
    } else {
      match = line.match(new RegExp('(.*)(style=(\'.*?\'))(.*)'))
    }
    if (!match) {
      return line;
    }

    const match0 = match[0]
    const match1 = match[1]
    const match2 = match[2]
    const match3 = match[3]
    const match4 = match[4]
    const styleText = match3.replace(/"|'/g, '')
    const styleObjText = styleText.replace(new RegExp('([^;]*):([^;]*);', 'g'), function (stl) {
      const kvMatch = stl.match(/(.*):(.*);/)
      const key = kvMatch[1].trim()
      const value = kvMatch[2].trim()
      const key2 = camelize(key)
      const ret = `${key2}:"${value}", `
      return ret;
    })
    return `${match1}style={{ ${styleObjText}}}${match4}`;
  })
  return styleObjStr;
}
export function activate(context: vscode.ExtensionContext) {

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('extension.html-to-react', () => {
    // The code you place here will be executed every time your command is executed
    let editor = window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No file opened.');
      return;
    }

    let selection = editor.selection;
    if (!selection) {
      vscode.window.showErrorMessage('No text selected.');
      return;
    }

    let text = editor.document.getText(selection);
    if (!text.length) {
      vscode.window.showErrorMessage('No text selected.');
      return;
    }
    text = text.replace(/class=/g, 'className=')
    text = text.replace(/autocomplete=/g, 'autoComplete=')
    text = text.replace(/autofocus=/g, 'autoFocus=')
    editor.edit(function (editBuilder) {
      editBuilder.delete(selection);
      const sections = text.split('style=');
      const formattedSections = [];
      for (let index = 0; index < sections.length; index++) {
        const sec = sections[index];
        if (index === 0) {
          formattedSections.push(sec)
        } else {
          let styleObjStr = getStylesObjectStr(`style=${sec}`, 'double')
          styleObjStr = getStylesObjectStr(styleObjStr, 'single')
          formattedSections.push(styleObjStr)
        }
      }
      text = formattedSections.join('')

      editBuilder.insert(selection.start, text);

      return true;
    });
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
