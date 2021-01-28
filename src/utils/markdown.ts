import { LineInfo } from '../types';

const rePrefix = /^[ \t]*(?:(?:[-+*]|\d+\.)[ \t]+(?:\[[ x]][ \t]+)?|>[ \t]*)*(?::[ \t]*)?/;
const reList = /(?:[-+*]|\d+\.)[ \t]+(?:\[[ x]][ \t]+)?$/;
const reCleanIndent = /[-+*\[\]x\d.]/g;
const rePureIndent = /[^ \t]/g;
const reIncrement = /(\d+)\.(?=[ \t]+$)/;
const reStripLast = /(?:(?:^[ \t]+)?(?:[-+*]|\d+\.|[>:])(?:[ \t]+\[[ x]])?[ \t]*|^[ \t]+)$/;

export function getLineInfo(str: string) : LineInfo {
  const offset = str.lastIndexOf("\n") + 1,
    line = str.substring(offset),
    m = rePrefix.exec(line);

  return {
    line,
    offset,
    prefix: m && m[0]
  };
}

export function isList(prefix: string) : boolean {
  return reList.test(prefix);
}

export function toIndent(prefix: string, pure: boolean) : string {
  return prefix.replace(pure ? rePureIndent : reCleanIndent, ' ');
}

export function increment(prefix: string) : string {
  return prefix.replace(reIncrement, function (_, n) {
    return (parseInt(n) + 1) + '.';
  })
}

export function stripLast(prefix: string) : string {
  return prefix.replace(reStripLast, '');
}
