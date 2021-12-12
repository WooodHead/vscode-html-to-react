'use strict';
import * as vscode from 'vscode';
import { window } from 'vscode';
const CSS_KEYS_IGNORE = [];
const CSS_VALUES_IGNORE = ['unset'];
const CSS_KEY_VALUES_IGNORE = [
  { key: 'font-size', value: '100%' },
  { key: 'quotes', value: 'auto' }
];

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
      if (CSS_KEYS_IGNORE.includes(key) || CSS_VALUES_IGNORE.includes(value)) return '';
      if (CSS_KEY_VALUES_IGNORE.filter(i => i.key === key && i.value === value).length > 0) return '';

      const key2 = camelize(key)
      const ret = `${key2}:"${value}", `
      return ret;
    })
    return `${match1}style={{ ${styleObjText}}}${match4}`;
  })
  return styleObjStr;
}

function processText(text) {
  text = text.replace(/class=/g, 'className=')
  text = text.replace(/autocomplete=/g, 'autoComplete=')
  text = text.replace(/autofocus=/g, 'autoFocus=')
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
  return text
}

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerCommand('extension.html-to-react', () => {
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
    editor.edit(function (editBuilder) {
      editBuilder.delete(selection);
      text = processText(text)

      editBuilder.insert(selection.start, text);
      return true;
    });
  });

  vscode.commands.registerCommand('extension.html-to-react-clipboard', async () => {
    let editor = window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No file opened.');
      return;
    }
    let selection = editor.selection;

    // @ts-ignore
    let text = await vscode.env.clipboard.readText();

    if (!text.length) {
      vscode.window.showErrorMessage('No text selected.');
      return;
    }
    editor.edit(function (editBuilder) {
      editBuilder.delete(selection);
      text = processText(text)

      editBuilder.insert(selection.start, text);
      return true;
    });
  });
}

export function deactivate() {
}
