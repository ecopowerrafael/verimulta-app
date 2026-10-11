export function responseBelongsToSession(expectedToken: string | undefined, currentToken: string | undefined): boolean {
  return Boolean(expectedToken && currentToken && expectedToken === currentToken);
}
