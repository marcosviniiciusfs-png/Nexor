# Leads cadastrados

Esta pasta recebe automaticamente os leads enviados pelo simulador da Nexor
Financeira.

Quando o Worker confirma o envio para a Meta Conversions API, ele tambem grava
um arquivo JSON do lead nesta pasta usando a GitHub Contents API. O cadastro so
e considerado concluido quando os dois passos terminam com sucesso.

Cada cadastro confirmado pelo Worker gera um arquivo JSON em:

```text
leads-cadastrados/YYYY-MM-DD/
```

Os commits gerados apenas por novos arquivos nesta pasta nao acionam o deploy do
GitHub Pages.
