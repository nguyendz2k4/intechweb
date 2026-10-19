/** Split our migration SQL without splitting DO dollar blocks or quoted semicolons. */
export function sqlStatements(source) {
  const statements = []
  let start = 0,
    quote = '',
    dollar = '',
    lineComment = false,
    blockComment = false
  for (let i = 0; i < source.length; i++) {
    const c = source[i],
      next = source[i + 1]
    if (lineComment) {
      if (c === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      if (c === '*' && next === '/') {
        blockComment = false
        i++
      }
      continue
    }
    if (dollar) {
      if (source.startsWith(dollar, i)) {
        i += dollar.length - 1
        dollar = ''
      }
      continue
    }
    if (quote) {
      if (c === quote) {
        if (next === quote) i++
        else quote = ''
      }
      continue
    }
    if (c === '-' && next === '-') {
      lineComment = true
      i++
      continue
    }
    if (c === '/' && next === '*') {
      blockComment = true
      i++
      continue
    }
    if (c === "'" || c === '"') {
      quote = c
      continue
    }
    if (c === '$') {
      const match = source.slice(i).match(/^\$(?:[a-zA-Z_][a-zA-Z0-9_]*)?\$/)
      if (match) {
        dollar = match[0]
        i += dollar.length - 1
        continue
      }
    }
    if (c === ';') {
      const statement = source.slice(start, i).trim()
      if (statement) statements.push(statement)
      start = i + 1
    }
  }
  if (quote || dollar || blockComment) throw new Error('Unterminated SQL migration block.')
  const tail = source.slice(start).trim()
  if (tail) statements.push(tail)
  return statements.filter(
    (statement) =>
      !/^(?:BEGIN|COMMIT)\s*$/i.test(statement.replace(/^--[^\n]*(?:\n|$)/gm, '').trim()),
  )
}
