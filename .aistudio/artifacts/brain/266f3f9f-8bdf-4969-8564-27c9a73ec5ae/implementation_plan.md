# OmniConvert Studio Pro — Lossless Universal Transcoder

Plano arquitetural e técnico consolidado para o **OmniConvert Studio Pro**, uma estação de trabalho para conversão universal de mídias e dados com estética Windows 11 Fluent Design, motores de codificação binária pura em TypeScript (`ArrayBuffer`/`DataView`), inspetor de qualidade/hexadecimal lado a lado e gerador de ponte nativa para Windows (`.EXE` via Tauri v2 e Electron).

---

## Decisões Confirmadas & Respostas do Usuário

> [!IMPORTANT]
> **Decisões e Exigências Inegociáveis Incorporadas:**
> 1. **Zero Placeholders & Implementação 100% Integral**: Proibido o uso de `// TODO`, simulações vazias ou código truncado. Todos os algoritmos binários (`imageBinaryEngine.ts` com ICO 6 resoluções e BMP 32-bit ARGB; `audioWavEngine.ts` com PCM 16-bit e 32-bit float; `dataDocumentEngine.ts` com transpiladores reais para JSON, CSV, TSV, SQL, XML, YAML, MD e HTML) serão codificados integralmente em TypeScript puro.
> 2. **Pipeline de Extração Real de Vídeo**: Para arquivos de vídeo inseridos no navegador, além de sintetizar o comando FFmpeg CLI exato para desktop, a interface executará a extração real no cliente de:
>    - Áudio do vídeo para arquivo `.WAV` PCM de alta resolução utilizando `AudioContext.decodeAudioData` em pipeline assíncrono.
>    - Captura de quadros (frame extraction) em resolução nativa para `.PNG`, `.WEBP`, `.BMP` ou `.ICO` usando um elemento `<video>` em buffer acoplado ao `Canvas2D`.
> 3. **Perfil de Inicialização**: Visão Geral com fila de demonstração pré-carregada abrangendo as 6 categorias essenciais ativas imediatamente.
> 4. **Empacotamento .ICO para Windows**: Suporte e seleção padrão do pacote completo com 6 resoluções (16×16, 32×32, 48×48, 64×64, 128×128 e 256×256 pixels) embutidas em um único contêiner `.ico`.
> 5. **Ponte Desktop Windows**: Destaque e geração prioritária para **Tauri v2 com Rust** (`tauri.conf.json` + `main.rs`), acompanhado de template Electron completo e script de automação PowerShell (`build-windows-exe.ps1`).

---

## 1. Visão Geral & Conceito Central

- **O que faz**: Central de conversão universal e sem perdas (lossless) rodando com motores binários reais diretamente no navegador (sem dependências frágeis de servidor ou WebAssembly bloqueado), capaz de:
  - Transformar imagens, redimensionar com interpolação bicúbica de alta precisão e empacotar arquivos `.ico` executáveis de 6 camadas para Windows.
  - Empacotar bitmaps `.bmp` de 32 bits (BGRA não compactado com cabeçalho BMP autêntico).
  - Decodificar e exportar áudio `.wav` PCM de estúdio (16-bit inteiro e 32-bit IEEE Float).
  - Extrair áudio de qualquer vídeo suportado pelo navegador e exportar capturas de tela/quadros em formatos de imagem de estúdio.
  - Converter bidirecionalmente estruturas de dados entre JSON, CSV, TSV, XML, YAML, SQL (tabelas e instruções `INSERT`), Markdown e HTML formatado.
  - Gerar comandos e pacotes desktop prontos para compilar um executável `.exe` nativo do Windows com aceleração de hardware (NVENC/AMF/QSV).
- **Público-alvo**: Desenvolvedores, designers de sistemas Windows, editores de mídia e cientistas de dados.
- **Valor Principal**: Conversão real imediata no browser sem intermediários externos, inspeção de cabeçalhos hexadecimais autênticos (Magic Bytes) e ponte direta para empacotamento nativo Windows com aceleração de hardware.

---

## 2. Experiência do Usuário & Design Visual (Windows 11 Fluent Dark)

### Fluxos Principais
1. **Inicialização com Seed Data**: A aplicação carrega com 6 itens de demonstração já gerados em memória (ícone app para .ICO, gráfico de teste para PNG/WebP, onda senoidal sintetizada para .WAV, e dados para JSON/CSV/SQL), permitindo testar conversão, baixar e inspecionar imediatamente.
2. **Adição de Arquivos (Drag-and-Drop & File Picker)**: O usuário arrasta qualquer imagem, áudio, vídeo ou arquivo de dados. O sistema detecta o tipo MIME, dimensões/duração, tamanho e calcula a taxa esperada.
3. **Módulo de Vídeo Dedicado (Extração & Transcodificação)**:
   - Extração direta de áudio em `.WAV` sem perda.
   - Captura de quadro atual/específico para `.PNG`, `.BMP` ou `.ICO`.
   - Síntese de linha de comando FFmpeg para remux `-c copy` ou reencodificação NVENC/AV1.
4. **Configuração de Presets e Qualidade**: Modal dedicado de parametrização granular:
   - *Imagens*: Toggle Lossless Pixel-Perfect, Chroma 4:4:4 vs 4:2:0, seletor de resoluções .ICO (16x16 até 256x256), escala bicúbica e preservação de canal Alpha.
   - *Vídeo*: Seleção de contêineres, CRF (0 a 51), Direct Stream Copy (-c copy), Codecs (H.264, HEVC, AV1, ProRes) e flags de aceleração GPU (NVENC, AMF, QSV).
   - *Áudio*: Sample Rate (44.1 kHz a 192 kHz), Bit Depth (16-bit PCM e 32-bit Float) e mixagem de canais.
5. **Execução em Lote**: Barra de progresso com tempo decorrido, taxa de transferência e geração do Blob final com liberação de memória (`URL.revokeObjectURL`).
6. **Inspeção de Qualidade & Hexadecimal**: Comparador Split-Screen (Original vs Convertido) com zoom até 400%, histograma de cores e visualizador dos primeiros 64 bytes hexadecimais para validação de assinaturas mágicas (`89 50 4E 47`, `00 00 01 00`, `52 49 46 46`).
7. **Windows .EXE Builder & CLI**: Painel com os scripts PowerShell, comandos FFmpeg/ImageMagick em tempo real e arquivos fonte para Tauri v2 e Electron prontos para copiar ou exportar em `.zip`/scripts.

### Sistema Visual Windows 11 Fluent
- **Fundo Mica / Acrylic**: Slate 950 (`#020617`) de base com superfícies de elevação Slate 900 (`#0F172A`) e cartões Slate 800/60 (`#1E293B`) com bordas sutis Slate 700/60 (`#334155`).
- **Acentos Primários**: Indigo 500 (`#6366F1`) e Cyan 500 (`#06B6D4`) para destaques e botões de ação com foco nítido (`focus-visible:ring-2`).
- **Status Semântico**: Emerald 500 (`#10B981`) para arquivos concluídos, Amber 500 (`#F59E0B`) para processamento/fila e Rose 500 (`#F43F5E`) para erros.
- **Barra de Título Nativa**: Simulação da barra de título do Windows 11 com controles funcionais (maximizar/restaurar, recolher, alternância de modo Web vs Desktop Bridge e indicador de estado de memória).
- **Tipografia**: Interface estruturada com `Plus Jakarta Sans` / `Outfit` para títulos e `JetBrains Mono` / `tabular-nums` estrito para taxas, tamanhos em bytes e dumps hexadecimais.

---

## 3. Decisões de Produto & Arquitetura de Trade-Offs

- **Motores Binários Puros vs. Dependências Externas Frágeis**:
  - *Abordagem*: Implementação em TypeScript puro com `ArrayBuffer`, `DataView` e `OffscreenCanvas`/`HTML5 Canvas` para `.ICO`, `.BMP`, `.WAV` e transpilador de dados (`JSON`/`CSV`/`SQL`/`XML`).
  - *Motivo*: Evita falhas de carregamento de CDNs ou limitações de SharedArrayBuffer de WebAssembly no ambiente de sandbox, fornecendo conversão 100% funcional no Live Preview sem latência de rede.
- **Gerenciamento de Memória Sem Leaks**:
  - *Abordagem*: Desacoplamento entre buffers pesados e o estado do React; armazenamento dos resultados em Object URLs com rastreamento de ciclo de vida e revogação proativa ao remover itens ou limpar a fila.
- **Ponte Desktop em Duas Vias**:
  - *Abordagem*: Fornecer no próprio aplicativo a transcrição dos comandos de linha de comando (FFmpeg/ImageMagick) e o código completo do Tauri v2 / Electron / PowerShell para os usuários que desejam compilar o `.exe` nativo com aceleração de hardware total (NVENC/ProRes/HEVC).

---

## 4. Arquitetura Técnica & Especificação dos Motores

### Diagrama de Blocos do Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                     OmniConvert Studio Pro                             │
│                  TitleBarWindows (Windows 11 Fluent)                   │
├──────────────────────────────┬─────────────────────────────────────────┤
│        Painel Lateral        │             Área Principal              │
│  - Seletor de Categorias     │  ┌───────────────────────────────────┐  │
│    (Imagens, Áudio, Vídeo,   │  │   Aba: Batch Queue Manager        │  │
│     Dados, Docs, Arquivos)   │  │   - Dropzone de Arquivos          │  │
│  - Estatísticas da Sessão    │  │   - Cards de Conversão            │  │
│  - Atalhos de Teclado        │  │   - Extração de Vídeo (WAV/Frames)│  │
│  - Presets Salvos            │  │   - Controles de Lote             │  │
│                              │  └───────────────────────────────────┘  │
│                              │  ┌───────────────────────────────────┐  │
│                              │  │   Aba: Quality & Hex Inspector    │  │
│                              │  │   - Comparador Side-by-Side       │  │
│                              │  │   - Visualizador Hexadecimal      │  │
│                              │  └───────────────────────────────────┘  │
│                              │  ┌───────────────────────────────────┐  │
│                              │  │   Aba: Windows .EXE Builder & CLI │  │
│                              │  │   - Tauri v2 / Rust Config        │  │
│                              │  │   - Script PowerShell de Build    │  │
│                              │  │   - Gerador de Comandos FFmpeg    │  │
│                              │  └───────────────────────────────────┘  │
├──────────────────────────────┴─────────────────────────────────────────┤
│                          Motores Binários Core                         │
│  ┌────────────────────┐ ┌───────────────────┐ ┌──────────────────────┐ │
│  │ imageBinaryEngine  │ │  audioWavEngine   │ │  dataDocumentEngine  │ │
│  │ - ICO Multi-size   │ │ - RIFF Header     │ │ - JSON/CSV/TSV/SQL   │ │
│  │ - BMP 32-bit ARGB  │ │ - 16-bit PCM      │ │ - XML/YAML/Markdown  │ │
│  │ - Canvas Resampler │ │ - 32-bit Float    │ │ - SVG & Text         │ │
│  │ - Video Frame Grab │ │ - Video Audio Rip │ │ - Zero TODOs/Stubs   │ │
│  └────────────────────┘ └───────────────────┘ └──────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Especificação Técnica dos Codificadores Binários

#### 1. Codificador .ICO Multi-Resoluções (`imageBinaryEngine.ts`)
- **Cabeçalho Principal (`ICONDIR`)** [6 bytes]:
  - `idReserved` (2 bytes, Little Endian): `0x0000`
  - `idType` (2 bytes, Little Endian): `0x0001` (1 para Ícone)
  - `idCount` (2 bytes, Little Endian): Quantidade de imagens embutidas (6 camadas: 16, 32, 48, 64, 128, 256)
- **Entradas de Diretório (`ICONDIRENTRY`)** [16 bytes cada]:
  - `bWidth` (1 byte): Largura (0 representa 256)
  - `bHeight` (1 byte): Altura (0 representa 256)
  - `bColorCount` (1 byte): 0 (se $\ge$ 8bpp)
  - `bReserved` (1 byte): 0
  - `wPlanes` (2 bytes, LE): 1
  - `wBitCount` (2 bytes, LE): 32 (ARGB)
  - `dwBytesInRes` (4 bytes, LE): Tamanho exato dos dados PNG
  - `dwImageOffset` (4 bytes, LE): Deslocamento absoluto do início do arquivo
- **Payload das Imagens**: Sub-imagens codificadas em PNG de alta definição para 16x16, 32x32, 48x48, 64x64, 128x128 e 256x256, montadas sequencialmente no `ArrayBuffer`.

#### 2. Codificador .BMP 32-bit ARGB (`imageBinaryEngine.ts`)
- **BITMAPFILEHEADER** [14 bytes]:
  - `bfType`: `0x4D42` ('BM')
  - `bfSize`: 14 + 40 + (Width * Height * 4)
  - `bfReserved1` / `bfReserved2`: 0
  - `bfOffBits`: 54 bytes
- **BITMAPINFOHEADER** [40 bytes]:
  - `biSize`: 40
  - `biWidth`: Largura
  - `biHeight`: Altura (positivo para bottom-up, negativo para top-down)
  - `biPlanes`: 1
  - `biBitCount`: 32
  - `biCompression`: 0 (BI_RGB não compactado)
  - `biSizeImage`: Width * Height * 4
- **Pixel Array**: Scanlines invertidas com mapeamento BGRA nativo do Windows.

#### 3. Codificador .WAV PCM RIFF & Extrator de Vídeo (`audioWavEngine.ts`)
- **RIFF Header Chunk**:
  - `ChunkID`: "RIFF" (`0x46464952`)
  - `ChunkSize`: 36 + SubChunk2Size
  - `Format`: "WAVE" (`0x45564157`)
- **FMT Sub-chunk**:
  - `Subchunk1ID`: "fmt " (`0x20746D66`)
  - `Subchunk1Size`: 16 (para PCM)
  - `AudioFormat`: 1 para PCM Inteiro, 3 para IEEE Float
  - `NumChannels`: 1 (Mono) ou 2 (Stereo)
  - `SampleRate`: 44100 / 48000 / 96000
  - `ByteRate`: SampleRate * NumChannels * (BitsPerSample / 8)
  - `BlockAlign`: NumChannels * (BitsPerSample / 8)
  - `BitsPerSample`: 16 ou 32
- **DATA Sub-chunk**:
  - `Subchunk2ID`: "data" (`0x61746164`)
  - `Subchunk2Size`: NumSamples * NumChannels * (BitsPerSample / 8)
  - Intercalação precisa de amostras com normalização e saturação (clipping) de segurança.
- **Extração de Áudio de Vídeo**:
  - Leitura do arquivo de vídeo via `ArrayBuffer` ou `<video>` buffer, decodificação dos canais de áudio via `AudioContext.decodeAudioData` e re-codificação direta em WAV PCM 16-bit / 32-bit Float.

#### 4. Transpilador Integral de Dados & Documentos (`dataDocumentEngine.ts`)
- Parser e serializador estruturado com validação de sintaxe para:
  - JSON $\longleftrightarrow$ CSV (com suporte a aspas, escape e cabeçalhos)
  - CSV $\longleftrightarrow$ TSV
  - JSON/CSV $\longleftrightarrow$ SQL (DDL `CREATE TABLE [tabela]` e sequências de `INSERT INTO [tabela] (...) VALUES (...)`)
  - JSON $\longleftrightarrow$ XML (com tags hierárquicas e atributos)
  - JSON $\longleftrightarrow$ YAML (com indentação de 2 espaços e arrays)
  - JSON/CSV $\longleftrightarrow$ Markdown (tabelas formatadas com pipes `|` e traços)
  - JSON/CSV $\longleftrightarrow$ HTML (tabelas estendidas com classes e tags semânticas)

#### 5. Gerador Desktop & CLI (`desktopCliGenerator.ts`)
- Geração de linha de comando precisa com argumentos de aceleração por hardware:
  - FFmpeg: `ffmpeg -i input.ext -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 320k output.mp4` ou `-c copy` (Remux sem perdas).
  - ImageMagick: `magick convert input.png -define icon:auto-resize=256,128,64,48,32,16 output.ico`.
  - Tauri v2: Configuração `tauri.conf.json` completa e código `main.rs` com integração de comandos nativos.
  - Script PowerShell: `build-windows-exe.ps1` com verificação de ferramentas via `winget` e automação de build.

---

## 5. Estrutura Modular dos 12 Arquivos

```
src/
├── types/
│   └── converter.ts              # 1. Interfaces completas de arquivo, formatos, presets e opções
├── engines/
│   ├── imageBinaryEngine.ts      # 2. Codificadores binários ICO 6 camadas, BMP 32-bit e capturador de vídeo
│   ├── audioWavEngine.ts         # 3. Decodificador Web Audio, extrator de vídeo e escritor RIFF WAV PCM
│   ├── dataDocumentEngine.ts     # 4. Transpilador integral JSON, CSV, TSV, SQL, XML, YAML, MD e HTML
│   └── desktopCliGenerator.ts    # 5. Comandos CLI e templates Tauri v2 / Electron / PowerShell
├── components/
│   ├── TitleBarWindows.tsx       # 6. Barra de título Fluent com botões de janela e status
│   ├── BatchQueueManager.tsx     # 7. Fila de processamento em lote, dropzone e ações de lote
│   ├── QualityInspectorModal.tsx # 8. Modal granular de CRF, Bitrate, .ICO e Presets
│   ├── HexQualityInspector.tsx   # 9. Comparador Split-Screen e visualizador Hexadecimal
│   └── WindowsDesktopBridge.tsx  # 10. Ponte para Tauri v2, Electron e scripts PowerShell
├── utils/
│   └── seedData.ts               # 11. 6 arquivos de demonstração sintetizados proceduralmente
├── App.tsx                       # 12. Orquestrador central e gerenciamento de estado reativo
```

---

## 6. Critérios de Validação & Verificação

1. **Compilação e Verificação Estrita**: O código TypeScript deve compilar sem nenhum aviso ou erro com `npm run build` / `compile_applet`.
2. **Download de Arquivos Reais**: O usuário poderá clicar em "Baixar" em um arquivo convertido para `.ico`, `.bmp` ou `.wav` e abri-lo perfeitamente no visualizador/reprodutor do Windows.
3. **Extração de Vídeo Funcional**: Testado com vídeos reais arrastados, com exportação de áudio para WAV e de frames selecionados para imagens.
4. **Magic Bytes Verificados no Hex Inspector**:
   - ICO: `00 00 01 00`
   - BMP: `42 4D` ('BM')
   - WAV: `52 49 46 46` ('RIFF') e `57 41 56 45` ('WAVE')
   - PNG: `89 50 4E 47`
5. **Sem Vazamento de Memória**: Blobs e Object URLs devidamente liberados ao remover itens da fila.
