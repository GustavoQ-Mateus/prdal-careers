import assert from 'node:assert/strict';
import test from 'node:test';
import { paraApi, paraTela } from '../src/perfilAdaptador.ts';

const ESTRUTURADO = {
  nome: 'Pessoa Exemplo',
  emails: [
    { id: 'e1', valor: 'secundario@exemplo.dev', principal: false },
    { id: 'e2', valor: 'principal@exemplo.dev', principal: true },
  ],
  telefones: [{ id: 't1', ddi: '+55', numero: '85 90000-0001', principal: true }],
  links: [
    { id: 'l1', tipo: 'linkedin', url: 'linkedin.com/in/pessoa' },
    { id: 'l2', tipo: 'instagram', url: 'instagram.com/pessoa' },
  ],
  endereco: { pais: 'Brasil', estado: 'CE', cidade: 'Fortaleza', bairro: 'Centro', logradouro: 'Rua Exemplo, 10', complemento: 'Sala 2' },
  outrosContatos: [{ id: 'o1', rotulo: 'WhatsApp', valor: '85 90000-0002', revisao: ['contato_sem_tipo'] }],
  resumo: 'Back-end com Python.',
  experiencias: [
    {
      id: 'x1',
      cargo: 'Desenvolvedora',
      empresa: 'Empresa A',
      dataInicioMes: 6,
      dataInicioAno: 2024,
      dataFimMes: null,
      dataFimAno: null,
      atual: true,
      local: { pais: 'Brasil', estado: 'CE', cidade: 'Fortaleza' },
      descricao: '- Atuei com Python.\nTecnologias: Python, FastAPI',
      revisao: ['tecnologias_na_descricao'],
    },
    {
      id: 'x2',
      cargo: 'Monitora',
      empresa: 'Escola C',
      dataInicioMes: null,
      dataInicioAno: 2019,
      dataFimMes: null,
      dataFimAno: null,
      atual: false,
      local: null,
      localLegado: 'Remoto',
      periodoLegado: 'verao de 2019',
      descricao: 'Monitoria de logica.',
      revisao: ['periodo_texto', 'local_texto'],
    },
  ],
  formacao: [
    { id: 'f1', grau: 'Tecnólogo', status: 'em_andamento', instituicao: 'Universidade A', curso: 'ADS', inicioMes: 2, inicioAno: 2023, fimMes: null, fimAno: null },
    { id: 'f2', grau: '', status: '', instituicao: '', curso: 'Curso livre de SQL', inicioMes: null, inicioAno: null, fimMes: null, fimAno: null, revisao: ['formato_antigo'] },
  ],
  certificacoes: [{ id: 'c1', titulo: 'Python', descricao: 'Escola A, 2025' }],
  idiomas: ['Português, nativo'],
  skills: ['Python'],
};

const LEGADO_NORMALIZADO = {
  ...ESTRUTURADO,
  telefones: [{ id: 't1', ddi: '', numero: '(11) 3000-0000', principal: true, revisao: ['ddi_ausente'] }],
  endereco: { pais: '', estado: '', cidade: '', legado: 'Remoto, qualquer lugar', revisao: ['localizacao_texto'] },
};

test('a tela mostra os mesmos campos de antes a partir do formato novo', () => {
  const tela = paraTela(ESTRUTURADO);
  assert.deepEqual(tela.contato, [
    { id: 'e1', tipo: 'email', valor: 'secundario@exemplo.dev' },
    { id: 'e2', tipo: 'email', valor: 'principal@exemplo.dev' },
    { id: 't1', tipo: 'telefone', valor: '+55 85 90000-0001' },
    { id: 'l1', tipo: 'linkedin', valor: 'linkedin.com/in/pessoa' },
    { id: 'l2', tipo: 'outro', rotulo: 'Instagram', valor: 'instagram.com/pessoa' },
    { id: 'endereco', tipo: 'localizacao', valor: 'Fortaleza - CE' },
    { id: 'o1', tipo: 'outro', rotulo: 'WhatsApp', valor: '85 90000-0002' },
  ]);
  assert.deepEqual(tela.experiencias[0], {
    id: 'x1',
    cargo: 'Desenvolvedora',
    empresa: 'Empresa A',
    periodo: '06/2024 - atual',
    local: 'Fortaleza - CE',
    descricao: '- Atuei com Python.',
    tecnologias: ['Python', 'FastAPI'],
  });
  assert.equal(tela.experiencias[1].periodo, 'verao de 2019');
  assert.equal(tela.experiencias[1].local, 'Remoto');
  assert.deepEqual(tela.formacao, ['Universidade A | Tecnólogo em ADS | 02/2023 - atual | em andamento', 'Curso livre de SQL']);
  assert.deepEqual(tela.certificacoes, ['Python, Escola A, 2025']);
});

test('salvar sem mudar nada devolve o perfil identico, com todo campo estruturado', () => {
  for (const perfil of [ESTRUTURADO, LEGADO_NORMALIZADO]) {
    assert.deepEqual(paraApi(paraTela(perfil), perfil), perfil);
  }
});

test('salvar outra secao nao toca contato, experiencia, formacao nem certificacao', () => {
  const tela = { ...paraTela(ESTRUTURADO), skills: ['Python', 'SQL'] };
  assert.deepEqual(paraApi(tela, ESTRUTURADO), { ...ESTRUTURADO, skills: ['Python', 'SQL'] });
});

test('editar um contato preserva principal, endereco completo e os demais itens', () => {
  const tela = paraTela(ESTRUTURADO);
  tela.contato = tela.contato.map((item) => (item.id === 'e2' ? { ...item, valor: 'novo@exemplo.dev' } : item));
  const salvo = paraApi(tela, ESTRUTURADO);
  assert.deepEqual(salvo.emails, [ESTRUTURADO.emails[0], { id: 'e2', valor: 'novo@exemplo.dev', principal: true }]);
  assert.deepEqual(salvo.endereco, ESTRUTURADO.endereco);
  assert.deepEqual(salvo.links, ESTRUTURADO.links);
  assert.deepEqual(salvo.outrosContatos, ESTRUTURADO.outrosContatos);
});

test('contato novo pela tela atual vai para a colecao certa', () => {
  const tela = paraTela({ ...ESTRUTURADO, endereco: null });
  tela.contato.push(
    { id: 'n1', tipo: 'telefone', valor: '+1 415 555-0100' },
    { id: 'n2', tipo: 'outro', rotulo: 'facebook', valor: 'facebook.com/pessoa' },
    { id: 'n3', tipo: 'localizacao', valor: 'Recife - PE' },
    { id: 'n4', tipo: 'github', valor: 'github.com/pessoa' },
  );
  const salvo = paraApi(tela, ESTRUTURADO);
  assert.deepEqual(salvo.telefones.at(-1), { id: 'n1', ddi: '+1', numero: '415 555-0100', principal: false });
  assert.deepEqual(salvo.links.slice(-2), [
    { id: 'n2', tipo: 'facebook', url: 'facebook.com/pessoa' },
    { id: 'n4', tipo: 'github', url: 'github.com/pessoa' },
  ]);
  assert.equal(salvo.endereco, 'Recife - PE');
});

test('mudar o endereco pela tela envia o texto para a api converter e remover nao perde os outros', () => {
  const tela = paraTela(ESTRUTURADO);
  tela.contato = tela.contato.map((item) => (item.id === 'endereco' ? { ...item, valor: 'Sobral - CE' } : item));
  assert.equal(paraApi(tela, ESTRUTURADO).endereco, 'Sobral - CE');
  tela.contato = tela.contato.filter((item) => item.id !== 'endereco');
  const sem = paraApi(tela, ESTRUTURADO);
  assert.equal(sem.endereco, null);
  assert.equal(sem.emails.length, 2);
});

test('editar periodo ou local da experiencia manda o texto e limpa so a marca correspondente', () => {
  const tela = paraTela(ESTRUTURADO);
  tela.experiencias[1] = { ...tela.experiencias[1], periodo: '01/2019 - 03/2019' };
  const [atual, editada] = paraApi(tela, ESTRUTURADO).experiencias;
  assert.equal(atual, ESTRUTURADO.experiencias[0]);
  assert.equal(editada.periodo, '01/2019 - 03/2019');
  assert.equal(editada.periodoLegado, undefined);
  assert.deepEqual([editada.dataInicioMes, editada.dataInicioAno, editada.atual], [null, null, false]);
  assert.equal(editada.localLegado, 'Remoto');
  assert.deepEqual(editada.revisao, ['local_texto']);

  tela.experiencias[0] = { ...tela.experiencias[0], local: 'Recife, PE' };
  const mudouLocal = paraApi(tela, ESTRUTURADO).experiencias[0];
  assert.equal(mudouLocal.local, 'Recife, PE');
  assert.equal(mudouLocal.dataInicioAno, 2024);
  assert.deepEqual(mudouLocal.revisao, ['tecnologias_na_descricao']);
});

test('o campo de tecnologias da tela continua indo para a ultima linha da descricao', () => {
  const tela = paraTela(ESTRUTURADO);
  tela.experiencias[0] = { ...tela.experiencias[0], tecnologias: ['Python', 'Redis'] };
  assert.equal(paraApi(tela, ESTRUTURADO).experiencias[0].descricao, '- Atuei com Python.\nTecnologias: Python, Redis');
  tela.experiencias.push({ id: 'x3', cargo: 'Dev', empresa: 'B', periodo: 'Jan 2020 a Dez 2021', local: 'Natal - RN', descricao: 'Fatos.', tecnologias: ['Go'] });
  const nova = paraApi(tela, ESTRUTURADO).experiencias[2];
  assert.deepEqual(nova, {
    id: 'x3', cargo: 'Dev', empresa: 'B', dataInicioMes: null, dataInicioAno: null, dataFimMes: null, dataFimAno: null,
    atual: false, local: 'Natal - RN', periodo: 'Jan 2020 a Dez 2021', descricao: 'Fatos.\nTecnologias: Go',
  });
});

test('editar uma linha de formacao preserva a estrutura das linhas intactas', () => {
  const tela = paraTela(ESTRUTURADO);
  tela.formacao = [tela.formacao[0], 'Curso livre de SQL avancado', 'MBA em Dados'];
  const salvo = paraApi(tela, ESTRUTURADO);
  assert.equal(salvo.formacao[0], ESTRUTURADO.formacao[0]);
  assert.deepEqual(
    salvo.formacao.slice(1).map(({ id, ...resto }) => [id.startsWith('formacao-'), resto.curso, resto.revisao]),
    [[true, 'Curso livre de SQL avancado', ['formato_antigo']], [true, 'MBA em Dados', ['formato_antigo']]],
  );
  tela.certificacoes = [];
  assert.deepEqual(paraApi(tela, ESTRUTURADO).certificacoes, []);
});
