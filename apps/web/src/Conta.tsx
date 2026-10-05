import { useEffect, useState } from 'react';
import {
  aceitarConsentimento, agendarExclusaoConta, cancelarExclusaoConta,
  getConta, getExportacaoConta, iniciarExportacaoConta, revogarConsentimento,
  type ContaResposta, type ExportacaoConta,
} from './api';
import { estadoExportacao, textoPrazoExclusao, urlAtualExportacao } from './contaEstado';
import { destinoErroConta } from './avisosConta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Conta({ onExclusaoAlterada }: { onExclusaoAlterada: (data: string | null) => void }) {
  const [conta, setConta] = useState<ContaResposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [exportacao, setExportacao] = useState<ExportacaoConta | null>(null);
  const [erroExportacao, setErroExportacao] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [senha, setSenha] = useState('');
  const [erroSenha, setErroSenha] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    getConta().then((dados) => {
      if (ativo) {
        setConta(dados);
        onExclusaoAlterada(dados.exclusaoAgendadaPara);
      }
    }).catch((falha) => { if (ativo) setErro((falha as Error).message); });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (!jobId) return;
    let ativo = true;
    let timer: number | undefined;
    async function consultar() {
      try {
        const dados = await getExportacaoConta(jobId!);
        if (!ativo) return;
        setExportacao(dados);
        if (estadoExportacao(dados.status).consultar) timer = window.setTimeout(consultar, 3000);
      } catch (falha) {
        if (ativo) setErroExportacao((falha as Error).message);
      }
    }
    void consultar();
    return () => { ativo = false; window.clearTimeout(timer); };
  }, [jobId]);

  async function alterarConsentimento() {
    if (!conta) return;
    setOcupado(true);
    setErro(null);
    try {
      if (conta.consentimento.aceitoEm) await revogarConsentimento();
      else await aceitarConsentimento();
      setConta(await getConta());
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  async function exportar() {
    setOcupado(true);
    setErroExportacao(null);
    setExportacao(null);
    try {
      const resposta = await iniciarExportacaoConta();
      setJobId(resposta.jobId);
    } catch (falha) {
      setErroExportacao((falha as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  async function baixar() {
    if (!jobId) return;
    setOcupado(true);
    setErroExportacao(null);
    try {
      const url = await urlAtualExportacao(jobId, getExportacaoConta);
      if (!url) {
        setErroExportacao('O arquivo não está disponível. Consulte novamente.');
        return;
      }
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (falha) {
      setErroExportacao((falha as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  async function excluir() {
    setOcupado(true);
    setErroSenha(null);
    try {
      const resposta = await agendarExclusaoConta(senha);
      setConta((atual) => atual && { ...atual, exclusaoAgendadaPara: resposta.exclusaoAgendadaPara });
      onExclusaoAlterada(resposta.exclusaoAgendadaPara);
      setDialogAberto(false);
      setSenha('');
    } catch (falha) {
      setErroSenha(destinoErroConta(falha, 'exclusao') === 'dialogo'
        ? 'Senha incorreta. Tente novamente.' : (falha as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  async function cancelarExclusao() {
    setOcupado(true);
    setErro(null);
    try {
      await cancelarExclusaoConta();
      setConta((atual) => atual && { ...atual, exclusaoAgendadaPara: null });
      onExclusaoAlterada(null);
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  if (!conta) return <p role={erro ? 'alert' : 'status'} className="text-muted">{erro ?? 'Carregando conta...'}</p>;

  const prazo = textoPrazoExclusao(conta.exclusaoAgendadaPara);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <p className="text-[13px] text-muted">E-mail: <span className="font-medium text-ink">{conta.email}</span></p>
      {erro && <p role="alert" className="text-score-bad">{erro}</p>}
      <Card>
        <CardHeader><CardTitle>Consentimento</CardTitle><CardDescription>Envio de dados ao provedor de inteligência artificial</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {conta.consentimento.aceitoEm ? (
            <p className="text-muted">Aceito em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(conta.consentimento.aceitoEm))}.</p>
          ) : (
            <p className="text-muted">Para gerar e reescrever currículos e usar o copiloto, enviamos seu perfil, currículos e conversas do copiloto ao provedor {conta.consentimento.provedor}, na região {conta.consentimento.regiao}.</p>
          )}
          <Button variant="secondary" disabled={ocupado} onClick={() => void alterarConsentimento()}>{conta.consentimento.aceitoEm ? 'Revogar' : 'Aceitar'}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Exportar meus dados</CardTitle><CardDescription>Prepare uma cópia dos dados da sua conta.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {exportacao && estadoExportacao(exportacao.status).consultar && <p role="status" className="text-muted">{exportacao.status === 'PENDENTE' ? 'Exportação pendente...' : 'Preparando exportação...'}</p>}
          {exportacao && estadoExportacao(exportacao.status).erro && <p role="alert" className="text-score-bad">Não foi possível exportar seus dados.</p>}
          {erroExportacao && <p role="alert" className="text-score-bad">{erroExportacao}</p>}
          {exportacao && estadoExportacao(exportacao.status).baixar
            ? <Button disabled={ocupado} onClick={() => void baixar()}>Baixar</Button>
            : !exportacao || estadoExportacao(exportacao.status).erro || erroExportacao
              ? <Button disabled={ocupado} onClick={() => void exportar()}>{exportacao || erroExportacao ? 'Tentar de novo' : 'Exportar meus dados'}</Button>
              : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Excluir conta</CardTitle><CardDescription>Você pode cancelar uma exclusão agendada até a data indicada.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {prazo && <p role="status" className="text-muted">{prazo}</p>}
          {conta.exclusaoAgendadaPara
            ? <Button variant="secondary" disabled={ocupado} onClick={() => void cancelarExclusao()}>Cancelar exclusão</Button>
            : <Button variant="destructive" onClick={() => setDialogAberto(true)}>Excluir conta</Button>}
        </CardContent>
      </Card>
      <Dialog open={dialogAberto} onOpenChange={(aberto: boolean) => { setDialogAberto(aberto); if (!aberto) { setErroSenha(null); setSenha(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conta</DialogTitle>
            <DialogDescription>Sua conta será excluída em 7 dias. Até lá, você pode cancelar na página Conta. Serão apagados seu perfil, currículos, oportunidades, conversas do copiloto e arquivos gerados.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="senha-exclusao">Confirme sua senha</Label>
            <Input id="senha-exclusao" type="password" autoComplete="current-password" value={senha} onChange={(evento) => setSenha(evento.target.value)} />
            {erroSenha && <p role="alert" className="text-[13px] text-score-bad">{erroSenha}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogAberto(false)}>Cancelar</Button>
            <Button variant="destructive" disabled={!senha || ocupado} onClick={() => void excluir()}>Confirmar exclusão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
