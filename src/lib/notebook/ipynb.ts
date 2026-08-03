import type { NotebookBlock } from "@/lib/types";

/**
 * Convert our internal NotebookBlock[] into a valid nbformat v4 .ipynb JSON structure.
 * This is the single place that knows about nbformat's shape — reused by the
 * download route and could later be reused by an "export to Colab" feature too.
 */
export function blocksToIpynb(title: string, blocks: NotebookBlock[]): object {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  const cells = sorted.map((block) => {
    const source = block.title
      ? `${block.type === "markdown" ? `### ${block.title}\n\n` : `# ${block.title}\n`}${block.content}`
      : block.content;

    return block.type === "markdown"
      ? {
          cell_type: "markdown",
          metadata: {},
          source: source.split("\n").map((line, i, arr) => (i < arr.length - 1 ? line + "\n" : line)),
        }
      : {
          cell_type: "code",
          metadata: {},
          execution_count: null,
          outputs: [],
          source: source.split("\n").map((line, i, arr) => (i < arr.length - 1 ? line + "\n" : line)),
        };
  });

  return {
    cells: [
      {
        cell_type: "markdown",
        metadata: {},
        source: [`# ${title}`],
      },
      ...cells,
    ],
    metadata: {
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3",
      },
      language_info: { name: "python", version: "3.11" },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };
}
