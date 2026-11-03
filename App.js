import { supabase } from './supabase';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, Switch, RefreshControl } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

function MainApp() {
  const [abaAtual, setAbaAtual] = useState('dashboard'); 
  
  const dataHoje = new Date();
  const mesAtualHoje = `${(dataHoje.getMonth() + 1).toString().padStart(2, '0')}/${dataHoje.getFullYear()}`;
  
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualHoje);
  const [menuAberto, setMenuAberto] = useState(false);
  const [temNotificacao, setTemNotificacao] = useState(false);
  const [menuAdicionarVisivel, setMenuAdicionarVisivel] = useState(false);
  const [modalMesVisivel, setModalMesVisivel] = useState(false);
  const [anoTemp, setAnoTemp] = useState(dataHoje.getFullYear());

  const [refreshing, setRefreshing] = useState(false);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState({});

  const [perfilNome, setPerfilNome] = useState('Dinho');
  const [perfilEmail, setPerfilEmail] = useState('dinho@email.com.br');
  const [modalEditarPerfilVisivel, setModalEditarPerfilVisivel] = useState(false);
  const [modalSegurancaVisivel, setModalSegurancaVisivel] = useState(false);
  const [biometriaAtiva, setBiometriaAtiva] = useState(false);

  const [anoVisaoAnual, setAnoVisaoAnual] = useState(dataHoje.getFullYear());

  const [metas, setMetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [transacoes, setTransacoes] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const transacoesSalvas = await AsyncStorage.getItem('@transacoes');
      const categoriasSalvas = await AsyncStorage.getItem('@categorias');
      const metasSalvas = await AsyncStorage.getItem('@metas');
      const nomeSalvo = await AsyncStorage.getItem('@perfilNome');

      if (transacoesSalvas) setTransacoes(JSON.parse(transacoesSalvas));
      
      if (categoriasSalvas) {
        setCategorias(JSON.parse(categoriasSalvas));
      } else {
        const categoriasPadrao = [
          { id: '1', nome: 'Alimentação', cor: '#F59E0B' }, { id: '2', nome: 'Moradia', cor: '#3B82F6' },
          { id: '3', nome: 'Cartão de Crédito', cor: '#8B5CF6' }, { id: '4', nome: 'Família', cor: '#10B981' },
          { id: '5', nome: 'Namorada', cor: '#EC4899' }, { id: '6', nome: 'Amigos', cor: '#14B8A6' },
          { id: '7', nome: 'Lazer', cor: '#F43F5E' }, { id: '8', nome: 'Saúde', cor: '#06B6D4' },
          { id: '9', nome: 'Renda', cor: '#10B981' }, { id: '10', nome: 'Outros', cor: '#64748B' }
        ];
        setCategorias(categoriasPadrao);
        AsyncStorage.setItem('@categorias', JSON.stringify(categoriasPadrao));
      }

      if (metasSalvas) setMetas(JSON.parse(metasSalvas));
      if (nomeSalvo) setPerfilNome(nomeSalvo);

    } catch (e) {
      console.log('Erro ao carregar dados', e);
    }
  };

  const atualizarTransacoes = async (novasTransacoes) => {
    setTransacoes(novasTransacoes);
    try { await AsyncStorage.setItem('@transacoes', JSON.stringify(novasTransacoes)); } 
    catch (e) { console.log('Erro ao salvar transações', e); }
  };

  const atualizarCategorias = async (novasCategorias) => {
    setCategorias(novasCategorias);
    try { await AsyncStorage.setItem('@categorias', JSON.stringify(novasCategorias)); } 
    catch (e) { console.log('Erro ao salvar categorias', e); }
  };

  const atualizarMetas = async (novasMetas) => {
    setMetas(novasMetas);
    try { await AsyncStorage.setItem('@metas', JSON.stringify(novasMetas)); } 
    catch (e) { console.log('Erro ao salvar metas', e); }
  };

  const [modalNovaMetaVisivel, setModalNovaMetaVisivel] = useState(false);
  const [idEditandoMeta, setIdEditandoMeta] = useState(null);
  const [novaMetaTitulo, setNovaMetaTitulo] = useState('');
  const [novaMetaAlvo, setNovaMetaAlvo] = useState('');
  const [novaMetaValorAtual, setNovaMetaValorAtual] = useState('');
  const [novaMetaCategoria, setNovaMetaCategoria] = useState('Outros');
  const [novaMetaModalidade, setNovaMetaModalidade] = useState('a_vista');
  const [novaMetaMeioPagamento, setNovaMetaMeioPagamento] = useState('Pix');
  const [novaMetaQtdParcelas, setNovaMetaQtdParcelas] = useState('2');
  const [novaMetaOrigemConta, setNovaMetaOrigemConta] = useState('Conta Corrente');
  const [novaMetaDataAlvo, setNovaMetaDataAlvo] = useState('');

  const meiosPagamento = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto'];
  const contasOrigem = ['Conta Corrente', 'Nubank', 'Itaú', 'Inter', 'Outros'];

  const [modalDepositarVisivel, setModalDepositarVisivel] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState(null);
  const [valorDeposito, setValorDeposito] = useState('');
  const [origemDeposito, setOrigemDeposito] = useState('carteira');

  const [modalCategoriasVisivel, setModalCategoriasVisivel] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [novaCategoriaCor, setNovaCategoriaCor] = useState('#3B82F6');
  const coresDisponiveis = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#14B8A6', '#F43F5E', '#06B6D4', '#EAB308', '#64748B', '#000000'];

  const [modalVisivel, setModalVisivel] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [novoTipo, setNovoTipo] = useState('saida');
  const [novaModalidade, setNovaModalidade] = useState('a_vista');
  const [qtdParcelas, setQtdParcelas] = useState('2');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaCategoriaForm, setNovaCategoriaForm] = useState('Alimentação'); 
  const [novoValor, setNovoValor] = useState('');
  const [novaDataCompra, setNovaDataCompra] = useState('');
  const [novaDataVencimento, setNovaDataVencimento] = useState('');

  const [calendarioVisivel, setCalendarioVisivel] = useState(false);
  const [campoDataAtivo, setCampoDataAtivo] = useState('compra'); 
  const [calMes, setCalMes] = useState(dataHoje.getMonth() + 1);
  const [calAno, setCalAno] = useState(dataHoje.getFullYear());

  const nomesMeses = { '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril', '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto', '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro' };
  const mesesAbreviados = [{ num: 1, nome: 'Jan' }, { num: 2, nome: 'Fev' }, { num: 3, nome: 'Mar' }, { num: 4, nome: 'Abr' }, { num: 5, nome: 'Mai' }, { num: 6, nome: 'Jun' }, { num: 7, nome: 'Jul' }, { num: 8, nome: 'Ago' }, { num: 9, nome: 'Set' }, { num: 10, nome: 'Out' }, { num: 11, nome: 'Nov' }, { num: 12, nome: 'Dez' }];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    carregarDados().then(() => setRefreshing(false));
  }, []);

  const transacoesDoMes = transacoes.filter(t => {
    const dataAlvo = t.dataVencimento || t.dataCompra;
    if (!dataAlvo) return true;
    const partesData = dataAlvo.split('/');
    if (partesData.length === 3) return `${partesData[1]}/${partesData[2]}` === mesSelecionado;
    return true;
  });

  const transacoesOrdenadasDoMes = [...transacoesDoMes].sort((a, b) => {
    if (a.fixado && !b.fixado) return -1;
    if (!a.fixado && b.fixado) return 1;
    return 0;
  });

  const receitas = transacoesDoMes.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
  const despesas = transacoesDoMes.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
  const saldo = receitas - despesas;
  const porcentagemDespesa = receitas > 0 ? (despesas / receitas) * 100 : (despesas > 0 ? 100 : 0);
  const porcentagemLimitada = Math.min(porcentagemDespesa, 100);

  const mesAtualNome = nomesMeses[mesSelecionado.split('/')[0]];
  const anoAtual = mesSelecionado.split('/')[1];

  const calcularDespesasPorCategoria = () => {
    let mapaCategorias = {};
    transacoesDoMes.forEach(t => {
      if (t.tipo === 'saida') {
        if (!mapaCategorias[t.categoria]) mapaCategorias[t.categoria] = 0;
        mapaCategorias[t.categoria] += t.valor;
      }
    });
    return Object.keys(mapaCategorias).map(cat => ({
      nome: cat,
      total: mapaCategorias[cat],
      porcentagem: despesas > 0 ? ((mapaCategorias[cat] / despesas) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  };
  const despesasAgrupadas = calcularDespesasPorCategoria();

  const gerarDadosAnuais = (ano) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    let dados = meses.map(m => ({ mes: m, receitas: 0, despesas: 0 }));
    transacoes.forEach(t => {
      const dataAlvo = t.dataVencimento || t.dataCompra;
      if (!dataAlvo) return;
      const partes = dataAlvo.split('/');
      if (partes.length === 3 && parseInt(partes[2], 10) === ano) {
        const mesIndex = parseInt(partes[1], 10) - 1;
        if (t.tipo === 'entrada') dados[mesIndex].receitas += t.valor;
        else if (t.tipo === 'saida') dados[mesIndex].despesas += t.valor;
      }
    });
    return dados;
  };

  const mudarMes = (direcao) => {
    let [mes, ano] = mesSelecionado.split('/');
    let mesNum = parseInt(mes, 10);
    let anoNum = parseInt(ano, 10);
    if (direcao === 'voltar') { mesNum -= 1; if (mesNum === 0) { mesNum = 12; anoNum -= 1; } } 
    else { mesNum += 1; if (mesNum === 13) { mesNum = 1; anoNum += 1; } }
    setMesSelecionado(`${mesNum.toString().padStart(2, '0')}/${anoNum}`);
  };

  const abrirSeletorMes = () => { setAnoTemp(parseInt(anoAtual)); setModalMesVisivel(true); };
  const escolherMes = (mesNum) => { setMesSelecionado(`${mesNum.toString().padStart(2, '0')}/${anoTemp}`); setModalMesVisivel(false); };
  
  const abrirCalendario = (campo) => { 
    setCampoDataAtivo(campo); 
    let dataReferencia = campo === 'meta_alvo' ? novaMetaDataAlvo : novaDataCompra;
    const partes = dataReferencia.split('/');
    if (partes.length === 3) { setCalMes(parseInt(partes[1], 10)); setCalAno(parseInt(partes[2], 10)); }
    setCalendarioVisivel(true); 
  };
  
  const selecionarDia = (dia) => {
    const dataFormatada = `${dia.toString().padStart(2, '0')}/${calMes.toString().padStart(2, '0')}/${calAno}`;
    
    if (campoDataAtivo === 'meta_alvo') {
      setNovaMetaDataAlvo(dataFormatada);
    } else if (campoDataAtivo === 'compra') { 
      setNovaDataCompra(dataFormatada); 
      if (!novaDataVencimento || novoTipo === 'entrada') setNovaDataVencimento(dataFormatada); 
    } else { 
      setNovaDataVencimento(dataFormatada); 
    }
    setCalendarioVisivel(false);
  };
  
  const diasNoMes = new Date(calAno, calMes, 0).getDate();
  const arrayDias = Array.from({ length: diasNoMes }, (_, i) => i + 1);

  const escolherTipoTransacao = (tipo) => {
    const hoje = new Date();
    const dataHojeFormatada = `${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${hoje.getFullYear()}`;
    setNovoTipo(tipo); setNovaCategoriaForm(tipo === 'entrada' ? 'Renda' : 'Cartão de Crédito'); setNovaDataCompra(dataHojeFormatada); setNovaDataVencimento(dataHojeFormatada); 
    setMenuAdicionarVisivel(false); setTimeout(() => { setModalVisivel(true); }, 150);
  };

  const fecharModal = () => { setModalVisivel(false); setIdEditando(null); setNovaDescricao(''); setNovoValor(''); setNovaModalidade('a_vista'); setQtdParcelas('2'); setNovoTipo('saida'); setNovaCategoriaForm('Cartão de Crédito'); setCalendarioVisivel(false); };

  const abrirEdicao = (item) => {
    setIdEditando(item.id); setNovoTipo(item.tipo); setNovaModalidade(item.modalidade || 'a_vista'); setNovaDescricao(item.descricao);
    setNovaCategoriaForm(item.categoria); setNovoValor(item.valor.toString()); setNovaDataCompra(item.dataCompra); setNovaDataVencimento(item.dataVencimento);
    setModalVisivel(true);
  };

  const salvarTransacao = () => {
    if (!novaDescricao || !novoValor) { Platform.OS === 'web' ? window.alert("Preencha a descrição e o valor.") : Alert.alert("Erro", "Preencha a descrição e o valor."); return; }
    if (novaModalidade !== 'fixa' && !novaDataCompra) { Platform.OS === 'web' ? window.alert("Selecione a data da transação.") : Alert.alert("Erro", "Selecione a data da transação."); return; }

    const valorTotal = parseFloat(novoValor.replace(',', '.'));
    let dataBaseCompra = novaDataCompra;
    let vencimentoBase = novoTipo === 'entrada' ? novaDataCompra : (novaDataVencimento || novaDataCompra);

    if (novoTipo === 'saida' && novaModalidade === 'fixa') {
      dataBaseCompra = `01/${mesSelecionado}`;
      vencimentoBase = `01/${mesSelecionado}`;
    }

    const somarMesesData = (dataStr, qtdMeses) => {
      const partes = dataStr.split('/'); let d = new Date(parseInt(partes[2], 10), parseInt(partes[1], 10) - 1 + qtdMeses, parseInt(partes[0], 10));
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    let transacoesAtualizadas = [];

    if (idEditando) {
      transacoesAtualizadas = transacoes.map(t => t.id === idEditando ? { ...t, descricao: novaDescricao, valor: valorTotal, tipo: novoTipo, categoria: novaCategoriaForm, modalidade: novaModalidade, dataCompra: dataBaseCompra, dataVencimento: vencimentoBase } : t );
    } else {
      if (novoTipo === 'saida' && novaModalidade === 'parcelada') {
        const nParcelas = Math.max(parseInt(qtdParcelas, 10) || 2, 2); const valorParcela = parseFloat((valorTotal / nParcelas).toFixed(2)); let novas = [];
        for (let i = 0; i < nParcelas; i++) { novas.push({ id: `${Date.now()}_${i}`, descricao: `${novaDescricao} [${i + 1}/${nParcelas}]`, valor: valorParcela, tipo: 'saida', modalidade: 'parcelada', parcelasInfo: `${i + 1}/${nParcelas}`, categoria: novaCategoriaForm, dataCompra: dataBaseCompra, dataVencimento: somarMesesData(vencimentoBase, i), fixado: false }); }
        transacoesAtualizadas = [...novas, ...transacoes];
      } else if (novoTipo === 'saida' && novaModalidade === 'fixa') {
        let recorrentes = [];
        for (let i = 0; i < 12; i++) { recorrentes.push({ id: `${Date.now()}_fixa_${i}`, descricao: `${novaDescricao} (Fixa)`, valor: valorTotal, tipo: 'saida', modalidade: 'fixa', categoria: novaCategoriaForm, dataCompra: dataBaseCompra, dataVencimento: somarMesesData(vencimentoBase, i), fixado: false }); }
        transacoesAtualizadas = [...recorrentes, ...transacoes];
      } else {
        const nova = { id: Date.now().toString(), descricao: novaDescricao, valor: valorTotal, tipo: novoTipo, modalidade: novoTipo === 'entrada' ? 'a_vista' : novaModalidade, categoria: novaCategoriaForm, dataCompra: dataBaseCompra, dataVencimento: vencimentoBase, fixado: false };
        transacoesAtualizadas = [nova, ...transacoes];
      }
    }
    atualizarTransacoes(transacoesAtualizadas);
    fecharModal();
  };

  const adicionarCategoria = () => {
    if (!novaCategoriaNome.trim()) { Platform.OS === 'web' ? window.alert('O nome da categoria não pode ficar vazio.') : Alert.alert('Erro', 'O nome da categoria não pode ficar vazio.'); return; }
    const nova = { id: Date.now().toString(), nome: novaCategoriaNome.trim(), cor: novaCategoriaCor };
    const novasCategorias = [nova, ...categorias];
    atualizarCategorias(novasCategorias);
    setNovaCategoriaNome('');
  };

  const excluirCategoria = (id, nome) => {
    if (nome === 'Renda' || nome === 'Outros') { Platform.OS === 'web' ? window.alert('Esta é uma categoria do sistema e não pode ser apagada.') : Alert.alert('Aviso', 'Esta é uma categoria do sistema e não pode ser apagada.'); return; }
    const deletar = () => {
      const novasCategorias = categorias.filter(c => c.id !== id);
      atualizarCategorias(novasCategorias);
      if (novaCategoriaForm === nome) setNovaCategoriaForm('Outros');
    };
    if (Platform.OS === 'web') { if (window.confirm(`Tem certeza que deseja apagar "${nome}"?`)) { deletar(); } } 
    else { Alert.alert('Apagar Categoria', `Tem certeza que deseja apagar "${nome}"?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: deletar }]); }
  };

  const excluirTransacao = (id) => { 
    const deletar = () => atualizarTransacoes(transacoes.filter(t => t.id !== id));
    if (Platform.OS === 'web') { if (window.confirm("Deseja apagar este registro?")) deletar(); } 
    else { Alert.alert("Excluir", "Deseja apagar este registro?", [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: deletar }]); }
  };

  const alternarFixar = (id) => { atualizarTransacoes(transacoes.map(t => t.id === id ? { ...t, fixado: !t.fixado } : t)); };

  const mostrarDetalhes = (item) => {
    let msg = `Descrição: ${item.descricao}\nCategoria: ${item.categoria}\nData: ${item.dataCompra}\nValor: R$ ${item.valor.toFixed(2)}`;
    if (item.modalidade) { const rotulos = { a_vista: 'À Vista', parcelada: 'Parcelada', fixa: 'Fixa / Recorrente' }; msg += `\nTipo: ${rotulos[item.modalidade] || item.modalidade}`; }
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Detalhes", msg, [{ text: "Fechar", style: "default" }]);
  };

  const fecharModalMeta = () => {
    setModalNovaMetaVisivel(false);
    setIdEditandoMeta(null);
    setNovaMetaTitulo('');
    setNovaMetaAlvo('');
    setNovaMetaValorAtual('');
    setNovaMetaCategoria('Outros');
    setNovaMetaModalidade('a_vista');
    setNovaMetaMeioPagamento('Pix');
    setNovaMetaQtdParcelas('2');
    setNovaMetaOrigemConta('Conta Corrente');
    setNovaMetaDataAlvo('');
    setCalendarioVisivel(false);
  };

  const abrirEdicaoMeta = (meta) => {
    setIdEditandoMeta(meta.id);
    setNovaMetaTitulo(meta.titulo);
    setNovaMetaAlvo(meta.valorAlvo.toString());
    setNovaMetaValorAtual(meta.valorAtual ? meta.valorAtual.toString() : '0');
    setNovaMetaCategoria(meta.categoria || 'Outros');
    setNovaMetaModalidade(meta.modalidade || 'a_vista');
    setNovaMetaMeioPagamento(meta.meioPagamento || 'Pix');
    setNovaMetaQtdParcelas(meta.qtdParcelas || '2');
    setNovaMetaOrigemConta(meta.origemConta || 'Conta Corrente');
    setNovaMetaDataAlvo(meta.dataAlvo || '');
    setModalNovaMetaVisivel(true);
  };

  const excluirMeta = (id) => {
    const deletar = () => atualizarMetas(metas.filter(m => m.id !== id));
    if (Platform.OS === 'web') { if (window.confirm("Deseja apagar esta meta?")) deletar(); } 
    else { Alert.alert("Excluir", "Deseja apagar esta meta?", [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: deletar }]); }
  };

  const alternarFixarMeta = (id) => {
    atualizarMetas(metas.map(m => m.id === id ? { ...m, fixado: !m.fixado } : m));
  };

  const salvarMeta = () => {
    if (!novaMetaTitulo || !novaMetaAlvo || !novaMetaDataAlvo) { 
      Platform.OS === 'web' ? window.alert("Preencha o título, o valor alvo e a data planejada!") : Alert.alert("Erro", "Preencha o título, o valor alvo e a data planejada!"); 
      return; 
    }
    
    const catEncontrada = categorias.find(c => c.nome === novaMetaCategoria);
    const corSelecionada = catEncontrada ? catEncontrada.cor : '#3B82F6';

    const objMeta = {
      titulo: novaMetaTitulo,
      valorAlvo: parseFloat(novaMetaAlvo.replace(',', '.')),
      categoria: novaMetaCategoria,
      modalidade: novaMetaModalidade,
      meioPagamento: novaMetaMeioPagamento,
      qtdParcelas: novaMetaModalidade === 'parcelada' ? novaMetaQtdParcelas : null,
      origemConta: novaMetaOrigemConta,
      dataAlvo: novaMetaDataAlvo,
      cor: corSelecionada
    };

    if (idEditandoMeta) {
      const metasAtualizadas = metas.map(m => m.id === idEditandoMeta ? {
        ...m,
        ...objMeta,
        valorAtual: parseFloat((novaMetaValorAtual || '0').replace(',', '.'))
      } : m);
      atualizarMetas(metasAtualizadas);
    } else {
      const nova = { 
        id: Date.now().toString(), 
        ...objMeta,
        valorAtual: 0, 
        fixado: false
      };
      atualizarMetas([nova, ...metas]);
    }
    fecharModalMeta();
  };

  const depositarNaMeta = () => {
    if (!valorDeposito) return; 
    const valorNum = parseFloat(valorDeposito.replace(',', '.'));
    
    const novasMetas = metas.map(m => { 
      if (m.id === metaSelecionada.id) return { ...m, valorAtual: m.valorAtual + valorNum }; 
      return m; 
    });
    atualizarMetas(novasMetas);

    if (origemDeposito === 'carteira') {
      const hoje = new Date();
      const dataHojeFormatada = `${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${hoje.getFullYear()}`;
      
      const novaTransacao = {
        id: Date.now().toString() + '_dep',
        descricao: `Depósito: ${metaSelecionada.titulo}`,
        valor: valorNum,
        tipo: 'saida',
        modalidade: 'a_vista',
        categoria: metaSelecionada.categoria || 'Outros',
        dataCompra: dataHojeFormatada,
        dataVencimento: dataHojeFormatada,
        fixado: false
      };
      atualizarTransacoes([novaTransacao, ...transacoes]);
    }

    setModalDepositarVisivel(false); 
    setValorDeposito(''); 
    setMetaSelecionada(null);
    setOrigemDeposito('carteira');
    Platform.OS === 'web' ? window.alert("Dinheiro guardado com sucesso!") : Alert.alert("Sucesso", "Dinheiro guardado com sucesso!");
  };

  const abrirDepositarMeta = (meta) => { setMetaSelecionada(meta); setOrigemDeposito('carteira'); setModalDepositarVisivel(true); };

  const lerNotificacao = () => {
    if (temNotificacao) { Platform.OS === 'web' ? window.alert("Tudo atualizado!") : Alert.alert("Sucesso", "Tudo atualizado!"); setTemNotificacao(false); } 
    else { Platform.OS === 'web' ? window.alert("Sem notificações.") : Alert.alert("Notificações", "Sem notificações."); }
  };

  const salvarEdicaoPerfil = async () => {
    try {
      await AsyncStorage.setItem('@perfilNome', perfilNome);
      Platform.OS === 'web' ? window.alert('Perfil atualizado!') : Alert.alert('Sucesso', 'Perfil atualizado!'); 
      setModalEditarPerfilVisivel(false);
    } catch (e) { console.log('Erro ao salvar perfil', e); }
  }

  const getTopBarTitle = () => {
    if (abaAtual === 'dashboard') return 'Dashboard';
    if (abaAtual === 'extrato') return 'Extrato Agrupado';
    if (abaAtual === 'perfil') return 'Meu Perfil';
    if (abaAtual === 'visao_anual') return 'Relatórios';
    if (abaAtual === 'metas') return 'Minhas Metas';
    return 'Dashboard';
  };

  const renderDashboard = () => (
    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.monthSelectorContainer}><TouchableOpacity style={styles.monthPill} onPress={abrirSeletorMes}><Text style={styles.monthPillText}>{mesAtualNome} / {anoAtual}</Text><Feather name="chevron-down" size={16} color="#1E293B" style={{ marginLeft: 5 }} /></TouchableOpacity></View>
      <View style={styles.cardsContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}><View><Text style={[styles.summaryLabel, { color: '#15803D' }]}>Receitas</Text><Text style={[styles.summaryValue, { color: '#15803D' }]}>R$ {receitas.toFixed(2).replace('.', ',')}</Text></View><Feather name="arrow-up-circle" size={28} color="#15803D" /></View>
        <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2' }]}><View><Text style={[styles.summaryLabel, { color: '#B91C1C' }]}>Despesas</Text><Text style={[styles.summaryValue, { color: '#B91C1C' }]}>R$ {despesas.toFixed(2).replace('.', ',')}</Text></View><Feather name="arrow-down-circle" size={28} color="#B91C1C" /></View>
        <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}><View><Text style={[styles.summaryLabel, { color: '#1D4ED8' }]}>Saldo do Mês</Text><Text style={[styles.summaryValue, { color: '#1D4ED8' }]}>R$ {saldo.toFixed(2).replace('.', ',')}</Text></View><Feather name="credit-card" size={28} color="#1D4ED8" /></View>
      </View>
      <View style={styles.chartSection}><Text style={styles.sectionTitle}>Progresso do Orçamento</Text><View style={styles.chartBox}><Text style={styles.chartLabel}>Você comprometeu <Text style={{fontWeight: 'bold', color: '#B91C1C'}}>{porcentagemLimitada.toFixed(0)}%</Text> das receitas.</Text><View style={styles.barraFundo}><View style={[styles.barraProgresso, { width: `${porcentagemLimitada}%` }]} /></View></View></View>
      <View style={styles.categoriasSection}><Text style={styles.sectionTitle}>Despesas por Categoria</Text><View style={styles.categoriasListContainer}>{despesasAgrupadas.length === 0 ? (<Text style={styles.textoVazio}>Nenhum gasto neste mês.</Text>) : (despesasAgrupadas.map((item, index) => { const catObj = categorias.find(c => c.nome === item.nome); const cor = catObj ? catObj.cor : '#94A3B8'; return (<View key={index} style={styles.catRow}><View style={styles.catLeft}><View style={[styles.catBolinha, { backgroundColor: cor }]} /><Text style={styles.catNome}>{item.nome}</Text></View><View style={styles.catRight}><Text style={styles.catValor}>R$ {item.total.toFixed(2)}</Text><Text style={styles.catPercent}>{item.porcentagem.toFixed(0)}%</Text></View></View>) }))}</View></View>
      <View style={{height: 100}} /> 
    </ScrollView>
  );

  const renderExtrato = () => {
    let mapaGrupos = {};
    transacoesOrdenadasDoMes.forEach(t => {
      if (!mapaGrupos[t.categoria]) { const catObj = categorias.find(c => c.nome === t.categoria); mapaGrupos[t.categoria] = { nome: t.categoria, cor: catObj ? catObj.cor : '#94A3B8', transacoes: [], totalEntrada: 0, totalSaida: 0 }; }
      mapaGrupos[t.categoria].transacoes.push(t);
      if (t.tipo === 'entrada') mapaGrupos[t.categoria].totalEntrada += t.valor; else mapaGrupos[t.categoria].totalSaida += t.valor;
    });

    const gruposArray = Object.values(mapaGrupos).sort((a,b) => (b.totalSaida + b.totalEntrada) - (a.totalSaida + a.totalEntrada));
    const alternarCategoria = (catNome) => { setCategoriasExpandidas(prev => ({ ...prev, [catNome]: !prev[catNome] })); };

    const renderCardTransacao = (item) => {
      const cardConteudo = (
        <TouchableOpacity style={[styles.listCardGrouped, item.fixado && styles.cardFixado]} activeOpacity={0.9} onPress={() => mostrarDetalhes(item)}>
          <View style={styles.listCardInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.fixado && <Text style={{ marginRight: 5 }}>📌</Text>}
              <Text style={styles.listCardTitle}>{item.descricao}</Text>
            </View>
            <Text style={styles.dataVencimentoText}>{item.dataCompra}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', flexDirection: 'row' }}>
            <Text style={[styles.listCardValue, item.tipo === 'entrada' ? styles.verde : styles.vermelho, { marginRight: 12 }]}>
              {item.tipo === 'entrada' ? '+ ' : '- '}R$ {item.valor.toFixed(2)}
            </Text>
            {Platform.OS === 'web' && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={() => alternarFixar(item.id)} style={{ padding: 6, backgroundColor: '#EFF6FF', borderRadius: 6 }}>
                  <Feather name="bookmark" size={14} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => abrirEdicao(item)} style={{ padding: 6, backgroundColor: '#FEF3C7', borderRadius: 6 }}>
                  <Feather name="edit-2" size={14} color="#D97706" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => excluirTransacao(item.id)} style={{ padding: 6, backgroundColor: '#FEE2E2', borderRadius: 6 }}>
                  <Feather name="trash-2" size={14} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );

      if (Platform.OS === 'web') {
        return <View key={item.id} style={styles.cardContainerGrouped}>{cardConteudo}</View>;
      }

      const renderRight = () => (<View style={styles.rightActions}><TouchableOpacity style={styles.btnEditar} onPress={() => abrirEdicao(item)}><Text style={styles.textoAcao}>✏️</Text></TouchableOpacity><TouchableOpacity style={styles.btnExcluir} onPress={() => excluirTransacao(item.id)}><Text style={styles.textoAcao}>🗑️</Text></TouchableOpacity></View>);
      const renderLeft = () => (<View style={styles.leftActions}><TouchableOpacity style={styles.btnFixar} onPress={() => alternarFixar(item.id)}><Text style={styles.textoAcao}>{item.fixado ? 'Desfixar' : '📌 Fixar'}</Text></TouchableOpacity></View>);

      return (
        <View key={item.id} style={styles.cardContainerGrouped}>
          <Swipeable renderRightActions={renderRight} renderLeftActions={renderLeft} containerStyle={styles.swipeable}>
            {cardConteudo}
          </Swipeable>
        </View>
      );
    };

    return (
      <ScrollView style={styles.extratoContainer} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.extratoHeader}><View><Text style={styles.extratoTitle}>Extrato Agrupado</Text><Text style={styles.extratoSubtitle}>Movimentações organizadas</Text></View><TouchableOpacity style={styles.btnExportar} onPress={() => Platform.OS === 'web' ? window.alert('Gerando PDF...') : Alert.alert('Exportar Extrato', `Gerando PDF...`)}><Feather name="file-text" size={18} color="#FFF" /><Text style={styles.btnExportarText}>Gerar PDF</Text></TouchableOpacity></View>
        <View style={styles.extratoMonthSelector}><TouchableOpacity style={styles.monthPill} onPress={abrirSeletorMes}><Text style={styles.monthPillText}>{mesAtualNome} / {anoAtual}</Text><Feather name="chevron-down" size={16} color="#1E293B" style={{ marginLeft: 5 }} /></TouchableOpacity></View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 120, marginTop: 10 }}>
