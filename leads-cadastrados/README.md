# Leads cadastrados

Esta pasta recebe automaticamente os leads enviados pelo simulador do Grupo
Uniao. O Worker grava cada cadastro em uma fila KV, e a GitHub Action de
exportacao cria os arquivos aqui periodicamente.

Cada cadastro confirmado pelo Worker gera um arquivo JSON em:

```text
leads-cadastrados/YYYY-MM-DD/
```

Os commits gerados apenas por novos arquivos nesta pasta nao acionam o deploy do
GitHub Pages.
