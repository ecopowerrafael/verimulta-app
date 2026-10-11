export interface FileTransfer {
  download(blob: Blob, filename: string): void;
}

export const webFileTransfer: FileTransfer = {
  download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
};
