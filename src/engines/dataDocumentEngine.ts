/**
 * Transpilador Bidirecional de Dados e Documentos do OmniConvert Studio Pro
 * Converte instantaneamente no navegador entre JSON, CSV, TSV, SQL, XML, YAML, Markdown e HTML.
 */

export interface ParsedTableData {
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
}

/**
 * Parser de CSV robusto que respeita aspas duplas, vírgulas internas e quebras de linha
 */
export function parseCsv(text: string, delimiter: string = ','): ParsedTableData {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Pula o próximo caractere
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Ignora CR do CRLF
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((f) => f.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].map((h, idx) => (h && h.length > 0 ? h : `coluna_${idx + 1}`));
  const rows: Record<string, string | number | boolean | null>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const rowObj: Record<string, string | number | boolean | null> = {};
    const line = lines[r];
    for (let c = 0; c < headers.length; c++) {
      const val = line[c] !== undefined ? line[c] : '';
      // Tenta inferir número ou booleano
      if (val === 'true') rowObj[headers[c]] = true;
      else if (val === 'false') rowObj[headers[c]] = false;
      else if (val !== '' && !isNaN(Number(val))) rowObj[headers[c]] = Number(val);
      else rowObj[headers[c]] = val;
    }
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Converte JSON para estrutura de tabela
 */
export function parseJsonToTable(jsonText: string): ParsedTableData {
  const parsed = JSON.parse(jsonText);
  let arrayData: unknown[] = [];

  if (Array.isArray(parsed)) {
    arrayData = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    // Procura por primeira chave que seja array
    const record = parsed as Record<string, unknown>;
    const arrayKey = Object.keys(record).find((k) => Array.isArray(record[k]));
    if (arrayKey && Array.isArray(record[arrayKey])) {
      arrayData = record[arrayKey] as unknown[];
    } else {
      arrayData = [parsed];
    }
  }

  if (arrayData.length === 0) {
    return { headers: [], rows: [] };
  }

  // Coleta todos os cabeçalhos únicos
  const headerSet = new Set<string>();
  for (const item of arrayData) {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach((k) => headerSet.add(k));
    }
  }
  const headers = Array.from(headerSet);

  const rows = arrayData.map((item) => {
    const rowObj: Record<string, string | number | boolean | null> = {};
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      headers.forEach((h) => {
        const v = obj[h];
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          rowObj[h] = v;
        } else if (v === null || v === undefined) {
          rowObj[h] = null;
        } else {
          rowObj[h] = JSON.stringify(v);
        }
      });
    }
    return rowObj;
  });

  return { headers, rows };
}

/**
 * Gera texto CSV/TSV a partir de dados tabulares
 */
export function formatCsv(data: ParsedTableData, delimiter: string = ','): string {
  const escapeField = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = data.headers.map(escapeField).join(delimiter);
  const rowLines = data.rows.map((row) =>
    data.headers.map((h) => escapeField(row[h])).join(delimiter)
  );

  return [headerLine, ...rowLines].join('\n');
}

/**
 * Gera script SQL DDL + DML completo (CREATE TABLE + INSERT INTO)
 */
export function formatSql(data: ParsedTableData, tableName: string = 'tabela_dados'): string {
  if (data.headers.length === 0) return `-- Tabela vazia\n`;

  // Inferência de tipos de coluna para SQLite / PostgreSQL / MySQL
  const columnDefs = data.headers.map((col) => {
    const cleanColName = col.replace(/[^a-zA-Z0-9_]/g, '_');
    // Verifica primeiro valor não nulo
    const sample = data.rows.find((r) => r[col] !== null && r[col] !== undefined)?.[col];
    let type = 'VARCHAR(255)';
    if (typeof sample === 'number') {
      type = Number.isInteger(sample) ? 'INTEGER' : 'DECIMAL(12, 4)';
    } else if (typeof sample === 'boolean') {
      type = 'BOOLEAN';
    }
    return `  "${cleanColName}" ${type}`;
  });

  const ddl = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  id SERIAL PRIMARY KEY,\n${columnDefs.join(',\n')}\n);\n\n`;

  // Gera INSERTs
  const inserts: string[] = [];
  for (const row of data.rows) {
    const cols = data.headers.map((h) => `"${h.replace(/[^a-zA-Z0-9_]/g, '_')}"`).join(', ');
    const vals = data.headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      return `'${String(val).replace(/'/g, "''")}'`;
    }).join(', ');

    inserts.push(`INSERT INTO "${tableName}" (${cols}) VALUES (${vals});`);
  }

  return ddl + inserts.join('\n');
}

/**
 * Gera documento XML estruturado
 */
export function formatXml(data: ParsedTableData, rootName: string = 'dataset'): string {
  const escapeXml = (unsafe: unknown): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const xmlRows = data.rows.map((row) => {
    const fields = data.headers
      .map((h) => {
        const cleanTag = h.replace(/[^a-zA-Z0-9_]/g, '_') || 'item';
        return `    <${cleanTag}>${escapeXml(row[h])}</${cleanTag}>`;
      })
      .join('\n');
    return `  <registro>\n${fields}\n  </registro>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${xmlRows.join('\n')}\n</${rootName}>`;
}

/**
 * Gera documento YAML com indentação e formatação correta
 */
export function formatYaml(data: ParsedTableData): string {
  const yamlRows = data.rows.map((row) => {
    const fields = data.headers.map((h, idx) => {
      const val = row[h];
      let formattedVal = 'null';
      if (val !== null && val !== undefined) {
        if (typeof val === 'number' || typeof val === 'boolean') {
          formattedVal = String(val);
        } else {
          formattedVal = JSON.stringify(String(val));
        }
      }
      const prefix = idx === 0 ? '- ' : '  ';
      return `${prefix}${h}: ${formattedVal}`;
    });
    return fields.join('\n');
  });

  return `# Dataset gerado pelo OmniConvert Studio Pro\n${yamlRows.join('\n')}`;
}

/**
 * Gera tabela em Markdown (| Coluna | Coluna |)
 */
export function formatMarkdown(data: ParsedTableData): string {
  if (data.headers.length === 0) return '_Nenhum dado disponível_';

  const headerRow = `| ${data.headers.join(' | ')} |`;
  const separatorRow = `| ${data.headers.map(() => '---').join(' | ')} |`;
  const dataRows = data.rows.map(
    (row) => `| ${data.headers.map((h) => String(row[h] ?? '')).join(' | ')} |`
  );

  return [headerRow, separatorRow, ...dataRows].join('\n');
}

/**
 * Gera tabela HTML semântica com classes utilitárias
 */
export function formatHtml(data: ParsedTableData, title: string = 'Relatório de Dados'): string {
  const headerTh = data.headers.map((h) => `<th style="padding: 10px 14px; border: 1px solid #334155; background: #0f172a; color: #f8fafc; font-weight: 600; text-align: left;">${h}</th>`).join('');
  const rowsTr = data.rows.map((row, idx) => {
    const bg = idx % 2 === 0 ? '#1e293b' : '#0f172a';
    const cells = data.headers.map((h) => `<td style="padding: 8px 14px; border: 1px solid #334155; color: #cbd5e1;">${String(row[h] ?? '')}</td>`).join('');
    return `<tr style="background: ${bg};">${cells}</tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #020617; color: #f8fafc; padding: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
  </style>
</head>
<body>
  <h2>${title}</h2>
  <table>
    <thead><tr>${headerTh}</tr></thead>
    <tbody>
${rowsTr}
    </tbody>
  </table>
</body>
</html>`;
}

/**
 * Função mestre de transcodificação de dados e documentos
 */
export async function convertDataDocument(
  rawContent: string,
  sourceFormat: string,
  targetFormat: string
): Promise<Blob> {
  const src = sourceFormat.toLowerCase().replace('.', '');
  const tgt = targetFormat.toLowerCase().replace('.', '');

  // 1. Converte qualquer entrada para ParsedTableData
  let tableData: ParsedTableData;

  if (src === 'json') {
    tableData = parseJsonToTable(rawContent);
  } else if (src === 'csv') {
    tableData = parseCsv(rawContent, ',');
  } else if (src === 'tsv') {
    tableData = parseCsv(rawContent, '\t');
  } else {
    // Tenta primeiro como JSON, senão como CSV
    try {
      tableData = parseJsonToTable(rawContent);
    } catch {
      tableData = parseCsv(rawContent, ',');
    }
  }

  // 2. Serializa no formato de destino
  let output = '';
  let mimeType = 'text/plain;charset=utf-8';

  switch (tgt) {
    case 'json':
      output = JSON.stringify(tableData.rows, null, 2);
      mimeType = 'application/json';
      break;
    case 'csv':
      output = formatCsv(tableData, ',');
      mimeType = 'text/csv;charset=utf-8';
      break;
    case 'tsv':
      output = formatCsv(tableData, '\t');
      mimeType = 'text/tab-separated-values;charset=utf-8';
      break;
    case 'sql':
      output = formatSql(tableData);
      mimeType = 'application/sql;charset=utf-8';
      break;
    case 'xml':
      output = formatXml(tableData);
      mimeType = 'application/xml;charset=utf-8';
      break;
    case 'yaml':
    case 'yml':
      output = formatYaml(tableData);
      mimeType = 'text/yaml;charset=utf-8';
      break;
    case 'md':
    case 'markdown':
      output = formatMarkdown(tableData);
      mimeType = 'text/markdown;charset=utf-8';
      break;
    case 'html':
      output = formatHtml(tableData);
      mimeType = 'text/html;charset=utf-8';
      break;
    default:
      output = formatCsv(tableData, ',');
      mimeType = 'text/plain;charset=utf-8';
  }

  return new Blob([output], { type: mimeType });
}
