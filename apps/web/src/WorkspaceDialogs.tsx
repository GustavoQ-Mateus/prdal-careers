import { useEffect, useState } from 'react';
import { criarAcao, type TipoAcaoOportunidade } from './api';
import { ROTULO_ACAO } from './rotulos';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

const TIPOS: TipoAcaoOportunidade[] = [
  'REVISAR_VAGA',
  'GERAR_CURRICULO',
  'ENVIAR_CANDIDATURA',
  'FAZER_FOLLOW_UP',
  'PREPARAR_ENTREVISTA',
  'PARTICIPAR_ENTREVISTA',
  'ENVIAR_MATERIAL',
  'OUTRO',
];

export function AcaoDialog({
  open,
  onOpenChange,
  oportunidadeId,
  onCriada,
}: {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  oportunidadeId: string;
  onCriada: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoAcaoOportunidade>('OUTRO');
  const [venceEm, setVenceEm] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) {
      setTitulo('');
      setTipo('OUTRO');
      setVenceEm('');
      setErro(null);
      setEnviando(false);
    }
  }, [open]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await criarAcao(oportunidadeId, {
        titulo,
        tipo,
        principal: true,
        venceEm: venceEm ? new Date(venceEm).toISOString() : undefined,
      });
      onOpenChange(false);
      onCriada();
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Definir proximo passo</DialogTitle>
          <DialogDescription>Registra a acao principal desta oportunidade.</DialogDescription>
        </DialogHeader>

        {erro && (
          <p className="text-[13px] text-score-bad" role="alert">
            {erro}
          </p>
        )}

        <form onSubmit={salvar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="acao-titulo">Titulo</Label>
            <Input id="acao-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="acao-tipo">Tipo</Label>
              <NativeSelect
                id="acao-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoAcaoOportunidade)}
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_ACAO[t]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="acao-prazo">Prazo</Label>
              <Input
                id="acao-prazo"
                type="datetime-local"
                value={venceEm}
                onChange={(e) => setVenceEm(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Salvando' : 'Definir passo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
