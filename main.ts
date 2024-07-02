import { Plugin, Editor, MarkdownView, Notice, MarkdownFileInfo } from "obsidian";

import {EditorState, Extension, StateField, Transaction} from "@codemirror/state";

import { EditorView } from "@codemirror/view";

import { ensureSyntaxTree } from "@codemirror/language";

import { format as prettier } from "prettier";
// const prettier = require("prettier");

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

  // time and log the time it takes to format all code blocks in the editor.
  findAllCodeBlocks(state: EditorState) {
    const codeBlocks: CodeBlock[] = [];
    const ast = ensureSyntaxTree(state, state.doc.length);

    let start = performance.now();

    let fmt: String = "";
    let text: String[] = [];
    let from: number = 0;

    ast?.cursor().iterate(
      (node: SyntaxNodeRef) => {
        console.log()
        if (node.type.name === "HyperMD-codeblock_HyperMD-codeblock-begin_HyperMD-codeblock-begin-bg_HyperMD-codeblock-bg") {
          fmt = ""
          text = []
          console.log("entered code block (%d, %d)", node.from, node.to);
        } else if (node.type.name === "formatting_formatting-code-block_hmd-codeblock") {
          // This is the "```<format>" portion of the code block.
          fmt = state.doc.sliceString(node.from + 3, node.to).trim();
          from = node.to + 1;
          console.log("code block fmt (%s, %d, %d)", fmt, node.from, node.to);
        } else if (node.type.name === "hmd-codeblock") {
          // This is the text in the code block sans the "```<format>" and ending "```".
          text.push(state.doc.sliceString(node.from, node.to));
          console.log("code block line (%d, %d)", node.from, node.to);
        } else if (node.type.name === "HyperMD-codeblock_HyperMD-codeblock-bg_HyperMD-codeblock-end_HyperMD-codeblock-end-bg") {
          console.log("adding code block (%s, %d, %d)", fmt, node.from, node.to);
          // TODO defer the join until the format command is run.
          let cb: CodeBlock = {fmt: fmt.toString(), text: text.join("\n"), from: from, to: node.from};
          codeBlocks.push(cb);
        } else {
          console.log("entered non-code block %s (%d, %d)", node.type.name, node.from, node.to);
        }

        return;
      },
      (node: SyntaxNodeRef) => {
        // if (node.type.name === "hmd-codeblock") {
        //   console.log("left code block (%d, %d)", node.from, node.to);
        // }

        return;
      }
    );

    let end = performance.now();
    console.log("time to find code blocks: %d ms", end - start);
    
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
          // Changes (replacements) are described with {from, to, insert} objects. 
          // For insertions, to can be omitted, and for deletions, insert can be omitted.
          // see https://codemirror.net/docs/ref/#state.RangeSet
          // should be able to quickly map changes to code blocks.
          // map and between look particularly useful.
          transaction.changes.map(change => { change. });
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
            new Notice("found '" + block.text + "'");

            const promise = prettier(
              block.text, 
              { 
                parser: "json",
              });
            
            promise.then((formatted) => {
              editor.replaceRange(formatted, {line: 0, ch: block.from}, {line: 0, ch: block.to});
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
