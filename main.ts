import { Plugin, Editor, MarkdownView, Notice, MarkdownFileInfo } from "obsidian";

import {EditorState, Extension, StateField, Transaction} from "@codemirror/state";

import { EditorView } from "@codemirror/view";

import { ensureSyntaxTree } from "@codemirror/language";

// import { format as prettier } from "prettier";
const prettier = require("prettier");

import { SyntaxNodeRef } from "@lezer/common";


// const plugins = [
//   require("prettier/parser-markdown")
// ]

class PluginState {
  codeBlocks: CodeBlock[];

  constructor(codeBlocks) {
    this.codeBlocks = codeBlocks
  }
}

interface CodeBlock {
  fmt: string;
  text: string;
  from: number;
  to: number;
}

// const plugins = [
// 	require("prettier/parser-babel"),
// 	require("prettier/parser-html"),
// 	require("prettier/parser-yaml"),
// 	require("prettier/parser-graphql"),
// 	require("prettier/parser-typescript")
// ];

export default class MyPlugin extends Plugin {

  // Dynamic array of extensions registered with codemirror.
  code_mirror_extension: Extension[] = [];
  code_mirror_state_field: StateField<PluginState>;

  // write a function which finds all code blocks in the editor and formats them.
  // This function should be called by the command.
  // You can use the following code to find all code blocks in the editor:
  // const codeBlocks = editor.getAllBlocks().filter(block => block.type === "code_block");
  // You can use the following code to format a code block:
  // const formatted = prettier.format(block.getText(), { parser: "markdown" });
  // block.setText(formatted);
  // formatAllCodeBlocks(editor: Editor) {
  //   const codeBlocks = editor.getAllBlocks().filter(block => block.type === "code_block");
  //   codeBlocks.forEach(block => {
  //     const formatted = prettier.format(block.getText(), { parser: "markdown" });
  //     block.setText(formatted);
  //   });
  // }

  findAllCodeBlocks(state: EditorState) {
    const codeBlocks: CodeBlock[] = [];
    const ast = ensureSyntaxTree(state, state.doc.length);

    let fmt: String = "";

    ast?.cursor().iterate(
      (node: SyntaxNodeRef) => {
        if (node.type.name === "formatting_formatting-code-block_hmd-codeblock") {
          // This is the "```<format>" portion of the code block.
          fmt = state.doc.sliceString(node.from + 3, node.to).trim();
          console.log("entered code block (%s, %d, %d)", fmt, node.from, node.to);
        } else if (node.type.name === "hmd-codeblock") {
          // This is the text in the code block sans the "```<format>" and ending "```".
          console.log("adding code block (%s, %d, %d)", fmt, node.from, node.to);
          let cb: CodeBlock = {fmt: fmt.toString(), text: state.doc.sliceString(node.from, node.to), from: node.from, to: node.to};
          codeBlocks.push(cb);
        } else {
          console.log("entered non-code block %s (%d, %d)", node.type.name, node.from, node.to);
        }

        return;
      },
      (node: SyntaxNodeRef) => {
        if (node.type.name === "hmd-codeblock") {
          console.log("left code block (%d, %d)", node.from, node.to);
        }

        return;
      }
    );
    
    return codeBlocks.reverse();
  }

  // Should this be a facet?
  state_field(): StateField<PluginState> {
    const plugin = this;
  
    return StateField.define({
      create(state: EditorState) {
        console.log("creating plugin state");
        return new PluginState(plugin.findAllCodeBlocks(state));
      },
      update(value: PluginState, transaction: Transaction) {
        console.log("updating plugin state");
        if (transaction.docChanged) {
          // TODO skip unchanged codeblocks.
          return new PluginState(plugin.findAllCodeBlocks(transaction.state));
        }
        
        return value;
      }
    })
  }

  async onload() {
    console.log("loading plugin");

    // this.registerMarkdownCodeBlockProcessor("markdown", (source, el, ctx) => {
    // })

    this.code_mirror_state_field = this.state_field();
    this.code_mirror_extension.push(this.code_mirror_state_field);
    this.registerEditorExtension({extension: this.code_mirror_extension});

    this.addCommand({
      id: 'format-code-blocks-uniq',
      name: 'Format code blocks',
      editorCallback: (editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
        const editorView = (view.editor as any).cm as EditorView;
        const pluginState = editorView.state.field(this.code_mirror_state_field);
        const codeBlocks = pluginState.codeBlocks;

        codeBlocks.forEach(block => {
          try {
            const promise = prettier.format(
              block.text, 
              { 
                parser: "xml",
              });
            
            promise.then((formatted) => {
              editor.replaceRange(formatted, {line: block.from, ch: 0}, {line: block.to, ch: 0});
            }).catch((e) => {
              console.log(e);
              new Notice("Format: " + e);
            });
          } catch (e) {
            console.log(e);
            new Notice("Format: " + e);
          }
        })
      }
    });
  }

  async onunload() {
    console.log("unloading plugin");

    // There is no this.unregisterEditorExtension method. Remove the codemirror
    // extension from the array and update the workspace options to apply.
    this.code_mirror_extension.pop();
    this.app.workspace.updateOptions();
  }
}
