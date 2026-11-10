import { supabase } from './supabase';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, Switch, RefreshControl } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';

function MainApp({ session }) {
  const userId = session.user.id;
  const [abaAtual, setAbaAtual] = useState('dashboard'); 
  
  const dataHoje = new Date();
  const anoCorrente = dataHoje.getFullYear();
  const mesAtualHoje = `${(dataHoje.getMonth() + 1).toString().padStart(2, '0')}/${anoCorrente}`;
  
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualHoje);
  const [menuAberto, setMenuAberto] = useState(false);
  const [temNotificacao, setTemNotificacao] = useState(false);
  const [menuAdicionarVisivel, setMenuAdicionarVisivel] = useState(false);
  const [modalMesVisivel, setModalMesVisivel] = useState(false);
  const [anoTemp, setAnoTemp] = useState(anoCorrente);

  const [refreshing, setRefreshing] = useState(false);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState({});

  const [perfilNome, setPerfilNome] = useState('Diógenes Pícoro');
  const [perfilEmail, setPerfilEmail] = useState(session.user.email);
  const [modalEditarPerfilVisivel, setModalEditarPerfilVisivel] = useState(false);
  const [modalSegurancaVisivel, setModalSegurancaVisivel] = useState(false);

  const [modalImportarVisivel, setModalImportarVisivel] = useState(false);
  const [conteudoCsvInput, setConteudoCsvInput] = useState('');
  const [transacoesPreview, setTransacoesPreview] = useState([]);

  const [anoVisaoAnual, setAnoVisaoAnual] = useState(anoCorrente);

  const [metas, setMetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [transacoes, setTransacoes] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const { data, error } = await supabase.from('cloud_state').select('*').eq('user_id', userId).maybeSingle();
      
      const categoriasPadrao = [
        { id: '1', nome: 'Alimentação', cor: '#F59E0B', icone: '🍔' }, { id: '2', nome: 'Moradia', cor: '#3B82F6', icone: '🏠' },
        { id: '3', nome: 'Cartão de Crédito', cor: '#8B5CF6', icone: '💳' }, { id: '4', nome: 'Família', cor: '#10B981', icone: '👨‍👩‍👧' },
        { id: '5', nome: 'Namorada', cor: '#EC4899', icone: '❤️' }, { id: '6', nome: 'Amigos', cor: '#14B8A6', icone: '🍻' },
        { id: '7', nome: 'Lazer', cor: '#F43F5E', icone: '🎮' }, { id: '8', nome: 'Saúde', cor: '#06B6D4', icone: '💊' },
        { id: '9', nome: 'Renda', cor: '#10B981', icone: '💰' }, { id: '10', nome: 'Outros', cor: '#64748B', icone: '🏷️' }
      ];

      if (!data) {
        await supabase.from('cloud_state').insert({
          user_id: userId,
          transacoes: [],
          categorias: categoriasPadrao,
          metas: [],
          perfil_nome: 'Diógenes Pícoro',
          perfil_email: session.user.email
        });
        setCategorias(categoriasPadrao);
      } else {
        setTransacoes(data.transacoes || []);
        // Compatibilidade com categorias antigas que não tinham ícone
        const catsCarregadas = (data.categorias && data.categorias.length > 0 ? data.categorias : categoriasPadrao).map(c => ({...c, icone: c.icone || '🏷️'}));
        setCategorias(catsCarregadas);
        setMetas(data.metas || []);
        if (data.perfil_nome) setPerfilNome(data.perfil_nome);
        if (data.perfil_email) setPerfilEmail(data.perfil_email);
      }
    } catch (e) {
      console.log('Erro ao carregar dados da nuvem', e);
    }
  };

  const atualizarTransacoes = async (novasTransacoes) => {
    setTransacoes(novasTransacoes);
    try { await supabase.from('cloud_state').update({ transacoes: novasTransacoes }).eq('user_id', userId); } 
    catch (e) { console.log('Erro ao salvar transações', e); }
  };

  const atualizarCategorias = async (novasCategorias) => {
    setCategorias(novasCategorias);
    try { await supabase.from('cloud_state').update({ categorias: novasCategorias }).eq('user_id', userId); } 
    catch (e) { console.log('Erro ao salvar categorias', e); }
  };

  const atualizarMetas = async (novasMetas) => {
    setMetas(novasMetas);
    try { await supabase.from('cloud_state').update({ metas: novasMetas }).eq('user_id', userId); } 
    catch (e) { console.log('Erro ao salvar metas', e); }
  };

  const somarMesesData = (dataStr, qtdMeses) => {
    const partes = dataStr.split('/');
    if (partes.length !== 3) return dataStr;
    let dia = parseInt(partes[0], 10);
    let mes = parseInt(partes[1], 10) - 1 + qtdMeses;
    let ano = parseInt(partes[2], 10);
    
    let d = new Date(ano, mes, dia);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Motor Inteligente CSV
  const processarTextoCsv = (texto) => {
    const linhas = texto.split('\n');
    let listaProcessada = [];

    linhas.forEach((linha, idx) => {
      if (!linha.trim() || linha.toUpperCase().includes('DATA;')) return; 
      
      const colunas = linha.split(';'); 
      if (colunas.length >= 4) {
        const diaMes = colunas[0]?.trim() || '01/01';
        const dataCompraStr = `${diaMes}/${anoCorrente}`;
        const descStr = colunas[1]?.trim() || 'Importado';
        const parcelaInfoStr = colunas[2]?.trim() || 'Única'; 
        
        let valorParcelaStr = colunas[3]?.trim() || '0';
        let isNegativo = valorParcelaStr.includes('-');
        let valorParcelaNum = parseFloat(valorParcelaStr.replace(/[R$\s-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;

        let totalParcelas = 1;
        let parcelaAtual = 1;
        if (parcelaInfoStr.toLowerCase() !== 'única' && parcelaInfoStr.includes('/')) {
          const partesParcela = parcelaInfoStr.split('/');
          parcelaAtual = parseInt(partesParcela[0], 10) || 1;
          totalParcelas = parseInt(partesParcela[1], 10) || 1;
        }

        let catSugerida = 'Cartão de Crédito';
        const descLower = descStr.toLowerCase();
        if (descLower.includes('uber') || descLower.includes('99') || descLower.includes('posto')) catSugerida = 'Lazer';
        else if (descLower.includes('mercado') || descLower.includes('ifood') || descLower.includes('padaria') || descLower.includes('saude')) catSugerida = 'Alimentação';
        else if (descLower.includes('aluguel') || descLower.includes('luz') || descLower.includes('agua')) catSugerida = 'Moradia';
        else if (descLower.includes('salario') || descLower.includes('pix recebido')) catSugerida = 'Renda';

        let tipoTransacao = isNegativo || descLower.includes('estorno') ? 'entrada' : 'saida';

        if (totalParcelas === 1) {
          listaProcessada.push({
            id: `${Date.now()}_${idx}`, descricao: descStr, valor: valorParcelaNum, tipo: tipoTransacao, modalidade: 'a_vista', categoria: catSugerida, dataCompra: dataCompraStr, dataVencimento: somarMesesData(dataCompraStr, 1), fixado: false, pago: false
          });
        } else {
          const mesesAjusteInicio = parcelaAtual - 1;
          const partesData = dataCompraStr.split('/');
          let dataInicioCompra = dataCompraStr;
          if (partesData.length === 3) {
            let dInicio = new Date(parseInt(partesData[2], 10), parseInt(partesData[1], 10) - 1 - mesesAjusteInicio, parseInt(partesData[0], 10));
            dataInicioCompra = `${dInicio.getDate().toString().padStart(2, '0')}/${(dInicio.getMonth() + 1).toString().padStart(2, '0')}/${dInicio.getFullYear()}`;
          }

          for (let p = 1; p <= totalParcelas; p++) {
            const dataVencParcela = somarMesesData(dataInicioCompra, p);
            listaProcessada.push({
              id: `${Date.now()}_${idx}_${p}`, descricao: `${descStr} [${p}/${totalParcelas}]`, valor: valorParcelaNum, tipo: tipoTransacao, modalidade: 'parcelada', parcelasInfo: `${p}/${totalParcelas}`, categoria: catSugerida, dataCompra: dataInicioCompra, dataVencimento: dataVencParcela, fixado: false, pago: false
            });
          }
        }
      }
    });

    setTransacoesPreview(listaProcessada);
    if (Platform.OS === 'web') window.alert(`${listaProcessada.length} parcelas geradas! Revise a prévia.`);
  };

  const confirmarImportacaoLote = () => {
    if (transacoesPreview.length === 0) return;
    const novas = [...transacoesPreview, ...transacoes];
    atualizarTransacoes(novas);

    if (transacoesPreview.length > 0) {
      const primeiraData = transacoesPreview[0].dataVencimento;
      const partes = primeiraData.split('/');
      if (partes.length === 3) setMesSelecionado(`${partes[1]}/${partes[2]}`);
    }

    setModalImportarVisivel(false); setConteudoCsvInput(''); setTransacoesPreview([]);
    Platform.OS === 'web' ? window.alert('Importação concluída!') : Alert.alert('Sucesso', 'Importação concluída!');
  };

  const [modalNovaMetaVisivel, setModalNovaMetaVisivel] = useState(false);
  const [modalCategoriasVisivel, setModalCategoriasVisivel] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [novaCategoriaCor, setNovaCategoriaCor] = useState('#3B82F6');
  const [novaCategoriaIcone, setNovaCategoriaIcone] = useState('🏷️');

  const coresDisponiveis = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#14B8A6', '#F43F5E', '#06B6D4', '#EAB308', '#64748B', '#000000'];
  const iconesDisponiveis = ['🏷️', '🏠', '🛒', '🚗', '🎓', '🎮', '💊', '🐶', '✈️', '👗', '📱', '🍔', '💰', '💡', '🥂', '👶', '💄', '⚽'];

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
  const [calAno, setCalAno] = useState(anoCorrente);

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
  const despesasPagas = transacoesDoMes.filter(t => t.tipo === 'saida' && t.pago).reduce((acc, t) => acc + t.valor, 0);
  const despesasPendentes = despesas - despesasPagas;

  const saldo = receitas - despesas;
  const porcentagemDespesa = receitas > 0 ? (despesas / receitas) * 100 : (despesas > 0 ? 100 : 0);
  const porcentagemLimitada = Math.min(porcentagemDespesa, 100);

  const mesAtualNome = nomesMeses[mesSelecionado.split('/')[0]];
  const anoAtual = mesSelecionado.split('/')[1];

  const calcularDespesasPorCategoria = () => {
    let mapaCategorias = {};
    transacoesDoMes.forEach(t => {
      if (t.tipo === 'saida' && !t.pago) { 
        if (!mapaCategorias[t.categoria]) mapaCategorias[t.categoria] = 0;
        mapaCategorias[t.categoria] += t.valor;
      }
    });
    return Object.keys(mapaCategorias).map(cat => ({
      nome: cat,
      total: mapaCategorias[cat],
      porcentagem: despesasPendentes > 0 ? ((mapaCategorias[cat] / despesasPendentes) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  };
  const despesasAgrupadas = calcularDespesasPorCategoria();

  // Hashtag Parser Inteligente
  const renderDescricaoComHashtag = (descricao, pago) => {
    const palavras = descricao.split(' ');
    return (
      <Text style={[styles.listCardTitle, pago && { textDecorationLine: 'line-through', color: '#94A3B8' }]}>
        {palavras.map((palavra, index) => {
          if (palavra.startsWith('#')) {
            return <Text key={index} style={{ color: '#3B82F6', fontWeight: 'bold' }}>{palavra} </Text>;
          }
          return palavra + ' ';
        })}
      </Text>
    );
  };

  const abrirSeletorMes = () => { setAnoTemp(parseInt(anoAtual)); setModalMesVisivel(true); };
  const escolherMes = (mesNum) => { setMesSelecionado(`${mesNum.toString().padStart(2, '0')}/${anoTemp}`); setModalMesVisivel(false); };
  
  const abrirCalendario = (campo) => { 
    setCampoDataAtivo(campo); 
    let dataReferencia = campo === 'meta_alvo' ? dataHoje.toLocaleDateString('pt-BR') : novaDataCompra;
    const partes = dataReferencia.split('/');
    if (partes.length === 3) { setCalMes(parseInt(partes[1], 10)); setCalAno(parseInt(partes[2], 10)); }
    setCalendarioVisivel(true); 
  };
  
  const selecionarDia = (dia) => {
    const dataFormatada = `${dia.toString().padStart(2, '0')}/${calMes.toString().padStart(2, '0')}/${calAno}`;
    if (campoDataAtivo === 'meta_alvo') {
      // Usado para metas (omitido neste bloco simplificado)
    } else if (campoDataAtivo === 'compra') { 
      setNovaDataCompra(dataFormatada); 
      if (!novaDataVencimento || novoTipo === 'entrada') setNovaDataVencimento(dataFormatada); 
    } else { 
      setNovaDataVencimento(dataFormatada); 
    }
    setCalendarioVisivel(false);
  };
  
  // --- INJEÇÃO EXCLUSIVA DOS DIAS DA SEMANA NO CALENDÁRIO ---
  const diasNoMes = new Date(calAno, calMes, 0).getDate();
  const arrayDias = Array.from({ length: diasNoMes }, (_, i) => i + 1);
  const primeiroDiaDoMes = new Date(calAno, calMes - 1, 1).getDay(); 
  const arrayDiasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diasVazios = Array.from({ length: primeiroDiaDoMes }, (_, i) => `vazio-${i}`);
  const arrayDiasCompletos = [...diasVazios, ...arrayDias];
  // -----------------------------------------------------------

  const escolherTipoTransacao = (tipo) => {
    const dataHojeFormatada = `${dataHoje.getDate().toString().padStart(2, '0')}/${(dataHoje.getMonth() + 1).toString().padStart(2, '0')}/${anoCorrente}`;
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
    
    const valorTotal = parseFloat(novoValor.replace(',', '.'));
    let dataBaseCompra = novaDataCompra;
    let vencimentoBase = novoTipo === 'entrada' ? novaDataCompra : (novaDataVencimento || novaDataCompra);

    if (novoTipo === 'saida' && novaModalidade === 'fixa') {
      dataBaseCompra = `01/${mesSelecionado}`;
      vencimentoBase = `01/${mesSelecionado}`;
    }

    let transacoesAtualizadas = [];

    if (idEditando) {
      transacoesAtualizadas = transacoes.map(t => t.id === idEditando ? { ...t, descricao: novaDescricao, valor: valorTotal, tipo: novoTipo, categoria: novaCategoriaForm, modalidade: novaModalidade, dataCompra: dataBaseCompra, dataVencimento: vencimentoBase } : t );
    } else {
      if (novoTipo === 'saida' && novaModalidade === 'parcelada') {
        const nParcelas = Math.max(parseInt(qtdParcelas, 10) || 2, 2); const valorParcela = parseFloat((valorTotal / nParcelas).toFixed(2)); let novas = [];
        for (let i = 0; i < nParcelas; i++) { novas.push({ id: `${Date.now()}_${i}`, descricao: `${novaDescricao} [${i + 1}/${nParcelas}]`, valor: valorParcela, tipo: 'saida', modalidade: 'parcelada', parcelasInfo: `${i + 1}/${nParcelas}`, categoria: novaCategoriaForm, dataCompra: dataBaseCompra, dataVencimento: somarMesesData(vencimentoBase, i), fixado: false, pago: false }); }
        transacoesAtualizadas = [...novas, ...transacoes];
      } else {
        const nova = { id: Date.now().toString(), descricao: novaDescricao, valor: valorTotal, tipo: novoTipo, modalidade: novoTipo === 'entrada' ? 'a_vista' : novaModalidade, categoria: novaCategoriaForm, dataCompra: dataBaseCompra, dataVencimento: vencimentoBase, fixado: false, pago: false };
        transacoesAtualizadas = [nova, ...transacoes];
      }
    }
    atualizarTransacoes(transacoesAtualizadas);
    fecharModal();
  };

  const adicionarCategoria = () => {
    if (!novaCategoriaNome.trim()) { Platform.OS === 'web' ? window.alert('Nome vazio.') : Alert.alert('Erro', 'Nome vazio.'); return; }
    const nova = { id: Date.now().toString(), nome: novaCategoriaNome.trim(), cor: novaCategoriaCor, icone: novaCategoriaIcone };
    atualizarCategorias([nova, ...categorias]);
    setNovaCategoriaNome(''); setNovaCategoriaIcone('🏷️');
  };

  const alternarFixar = (id) => { atualizarTransacoes(transacoes.map(t => t.id === id ? { ...t, fixado: !t.fixado } : t)); };
  const alternarPago = (id) => { atualizarTransacoes(transacoes.map(t => t.id === id ? { ...t, pago: !t.pago } : t)); };
  const excluirTransacao = (id) => { 
    const deletar = () => atualizarTransacoes(transacoes.filter(t => t.id !== id));
    if (Platform.OS === 'web') { if (window.confirm("Deseja apagar este registro?")) deletar(); } else { Alert.alert("Excluir", "Apagar registro?", [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: deletar }]); }
  };

  const renderDashboard = () => (
    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.monthSelectorContainer}>
        <TouchableOpacity style={styles.monthPill} onPress={abrirSeletorMes}>
          <Text style={styles.monthPillText}>{mesAtualNome} {anoAtual}</Text>
          <Feather name="chevron-down" size={16} color="#1E293B" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>

      {/* NOVO GRÁFICO CIRCULAR STYLED (Donut / Progresso) */}
      <View style={styles.donutContainer}>
        <View style={styles.donutWrapper}>
          <View style={[styles.donutRingBackground, { borderColor: '#F1F5F9' }]} />
          <View style={[styles.donutRingForeground, { borderColor: '#3B82F6', transform: [{ rotate: `${Math.min((porcentagemLimitada / 100) * 360, 360)}deg` }] }]} />
          <View style={styles.donutInner}>
            <Text style={styles.donutSubText}>Saldo Livre</Text>
            <Text style={styles.donutMainText}>R$ {saldo >= 0 ? saldo.toFixed(2) : '0.00'}</Text>
          </View>
        </View>
        <Text style={styles.donutLegenda}>Você usou {porcentagemLimitada.toFixed(0)}% das suas receitas este mês.</Text>
      </View>

      <View style={styles.statusPagamentoContainer}>
        <View style={[styles.pagamentoCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.pagamentoLabel}>Pendentes</Text>
          <Text style={[styles.pagamentoValor, { color: '#F59E0B' }]}>R$ {despesasPendentes.toFixed(2)}</Text>
        </View>
        <View style={[styles.pagamentoCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.pagamentoLabel}>Pagas</Text>
          <Text style={[styles.pagamentoValor, { color: '#10B981' }]}>R$ {despesasPagas.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.categoriasSection}>
        <Text style={styles.sectionTitle}>Maiores Gastos</Text>
        <View style={styles.categoriasListContainer}>
          {despesasAgrupadas.length === 0 ? (<Text style={styles.textoVazio}>Sem gastos pendentes.</Text>) : (
            despesasAgrupadas.map((item, index) => { 
              const catObj = categorias.find(c => c.nome === item.nome); 
              const cor = catObj ? catObj.cor : '#94A3B8'; 
              const icone = catObj ? catObj.icone : '🏷️';
              return (
                <View key={index} style={styles.catRowAdvanced}>
                  <View style={styles.catRowTop}>
                    <View style={styles.catLeftInfo}>
                      <View style={[styles.catIconContainer, { backgroundColor: cor + '20' }]}>
                        <Text style={styles.catEmoji}>{icone}</Text>
                      </View>
                      <Text style={styles.catNomeAdvanced}>{item.nome}</Text>
                    </View>
                    <View style={styles.catRightInfo}>
                      <Text style={styles.catValorAdvanced}>R$ {item.total.toFixed(2)}</Text>
                      <Text style={styles.catPercentAdvanced}>{item.porcentagem.toFixed(0)}%</Text>
                    </View>
                  </View>
                  <View style={styles.catProgressBarBg}>
                    <View style={[styles.catProgressBarFill, { backgroundColor: cor, width: `${item.porcentagem}%` }]} />
                  </View>
                </View>
              ) 
            })
          )}
        </View>
      </View>
      <View style={{height: 100}} /> 
    </ScrollView>
  );

  const renderExtrato = () => {
    let mapaGrupos = {};
    transacoesOrdenadasDoMes.forEach(t => {
      let nomeGrupo = t.pago ? '✅ PAGOS / CONCLUÍDOS' : t.categoria;
      if (!mapaGrupos[nomeGrupo]) { 
        const catObj = categorias.find(c => c.nome === t.categoria); 
        const corGrupo = t.pago ? '#10B981' : (catObj ? catObj.cor : '#94A3B8');
        const iconeGrupo = t.pago ? '✔️' : (catObj ? catObj.icone : '🏷️');
        mapaGrupos[nomeGrupo] = { nome: nomeGrupo, cor: corGrupo, icone: iconeGrupo, transacoes: [], totalEntrada: 0, totalSaida: 0, isPago: t.pago }; 
      }
      mapaGrupos[nomeGrupo].transacoes.push(t);
      if (t.tipo === 'entrada') mapaGrupos[nomeGrupo].totalEntrada += t.valor; else mapaGrupos[nomeGrupo].totalSaida += t.valor;
    });

    const gruposArray = Object.values(mapaGrupos).sort((a,b) => {
      if (a.isPago && !b.isPago) return 1;
      if (!a.isPago && b.isPago) return -1;
      return (b.totalSaida + b.totalEntrada) - (a.totalSaida + a.totalEntrada);
    });

    const alternarCategoria = (catNome) => { setCategoriasExpandidas(prev => ({ ...prev, [catNome]: !prev[catNome] })); };

    const renderCardTransacao = (item) => {
      const cardConteudo = (
        <TouchableOpacity style={[styles.listCardGrouped, item.fixado && styles.cardFixado]} activeOpacity={0.9}>
          <View style={styles.listCardInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.fixado && <Text style={{ marginRight: 5 }}>📌</Text>}
              {renderDescricaoComHashtag(item.descricao, item.pago)}
            </View>
            <Text style={styles.dataVencimentoText}>Vencimento: {item.dataVencimento}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', flexDirection: 'row' }}>
            <Text style={[styles.listCardValue, item.tipo === 'entrada' ? styles.verde : styles.vermelho, { marginRight: 12 }, item.pago && { color: '#94A3B8' }]}>
              {item.tipo === 'entrada' ? '+ ' : '- '}R$ {item.valor.toFixed(2)}
            </Text>
            {Platform.OS === 'web' && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={() => alternarPago(item.id)} style={{ padding: 6, backgroundColor: item.pago ? '#D1FAE5' : '#F1F5F9', borderRadius: 6 }}>
                  <Feather name="check" size={14} color={item.pago ? '#10B981' : '#94A3B8'} />
                </TouchableOpacity>
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

      if (Platform.OS === 'web') return <View key={item.id} style={styles.cardContainerGrouped}>{cardConteudo}</View>;

      const renderRight = () => (<View style={styles.rightActions}><TouchableOpacity style={styles.btnEditar} onPress={() => abrirEdicao(item)}><Text style={styles.textoAcao}>✏️</Text></TouchableOpacity><TouchableOpacity style={styles.btnExcluir} onPress={() => excluirTransacao(item.id)}><Text style={styles.textoAcao}>🗑️</Text></TouchableOpacity></View>);
      const renderLeft = () => (<View style={styles.leftActions}><TouchableOpacity style={[styles.btnFixar, {backgroundColor: '#10B981'}]} onPress={() => alternarPago(item.id)}><Text style={styles.textoAcao}>{item.pago ? 'Desmarcar' : '✅ Pagar'}</Text></TouchableOpacity></View>);

      return (
        <View key={item.id} style={styles.cardContainerGrouped}>
          <Swipeable renderRightActions={renderRight} renderLeftActions={renderLeft} containerStyle={styles.swipeable}>{cardConteudo}</Swipeable>
        </View>
      );
    };

    return (
      <ScrollView style={styles.extratoContainer} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.extratoHeader}>
          <View><Text style={styles.extratoTitle}>Extrato Agrupado</Text><Text style={styles.extratoSubtitle}>Lançamentos de {mesAtualNome}</Text></View>
        </View>
        <View style={styles.extratoMonthSelector}>
          <TouchableOpacity style={styles.monthPill} onPress={abrirSeletorMes}>
            <Text style={styles.monthPillText}>{mesAtualNome} / {anoAtual}</Text>
            <Feather name="chevron-down" size={16} color="#1E293B" style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 120, marginTop: 10 }}>
           {gruposArray.length === 0 ? (
             <Text style={styles.textoVazio}>Nenhuma movimentação neste mês.</Text>
           ) : (
             gruposArray.map(grupo => {
               const isExpandido = categoriasExpandidas[grupo.nome]; 
               const saldoFinalCategoria = grupo.totalEntrada - grupo.totalSaida;
               return (
                  <View key={grupo.nome} style={styles.grupoContainer}>
                     <TouchableOpacity style={styles.grupoHeader} onPress={() => alternarCategoria(grupo.nome)} activeOpacity={0.8}>
                       <View style={{flexDirection: 'row', alignItems: 'center'}}>
                         <View style={[styles.catIconContainerPequeno, { backgroundColor: grupo.cor + '20' }]}><Text style={{fontSize: 12}}>{grupo.icone}</Text></View>
                         <Text style={styles.grupoTitulo}>{grupo.nome}</Text>
                         <Text style={styles.grupoQtd}>({grupo.transacoes.length})</Text>
                       </View>
                       <View style={{flexDirection: 'row', alignItems: 'center'}}>
                         <Text style={[styles.grupoTotal, saldoFinalCategoria >= 0 ? styles.verde : styles.vermelho, grupo.isPago && {color: '#10B981'}]}>R$ {Math.abs(saldoFinalCategoria).toFixed(2)}</Text>
                         <Feather name={isExpandido ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" style={{marginLeft: 10}} />
                       </View>
                     </TouchableOpacity>
                     {isExpandido && (<View style={styles.grupoConteudo}>{grupo.transacoes.map(t => renderCardTransacao(t))}</View>)}
                  </View>
               );
             })
           )}
        </View>
      </ScrollView>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setMenuAberto(true)} style={styles.topBarIcon}><Feather name="menu" size={28} color="#1E293B" /></TouchableOpacity>
          <Text style={styles.topBarTitle}>{getTopBarTitle()}</Text>
          <TouchableOpacity style={styles.topBarIcon}>
            <View><Feather name="bell" size={24} color="#1E293B" />{temNotificacao && <View style={styles.notificationBadge} />}</View>
          </TouchableOpacity>
        </View>

        {abaAtual === 'dashboard' && renderDashboard()}
        {abaAtual === 'extrato' && renderExtrato()}

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setAbaAtual('dashboard')}><Feather name="home" size={24} color={abaAtual === 'dashboard' ? '#3B82F6' : '#94A3B8'} /><Text style={[styles.navText, abaAtual === 'dashboard' && styles.navTextAtivo]}>Início</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setAbaAtual('extrato')}><Feather name="list" size={24} color={abaAtual === 'extrato' ? '#3B82F6' : '#94A3B8'} /><Text style={[styles.navText, abaAtual === 'extrato' && styles.navTextAtivo]}>Extrato</Text></TouchableOpacity>
          <View style={styles.fabWrapper}><TouchableOpacity style={styles.fabBtn} onPress={() => setMenuAdicionarVisivel(true)}><Feather name="plus" size={32} color="#FFF" /></TouchableOpacity></View>
          <TouchableOpacity style={styles.navItem} onPress={() => setModalImportarVisivel(true)}><Feather name="upload-cloud" size={24} color={'#94A3B8'} /><Text style={styles.navText}>Importar</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setModalCategoriasVisivel(true)}><Feather name="tag" size={24} color={'#94A3B8'} /><Text style={styles.navText}>Tags</Text></TouchableOpacity>
        </View>

        <Modal animationType="slide" transparent={true} visible={modalVisivel} onRequestClose={fecharModal}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalFundoBottomSheet}>
            <View style={styles.modalConteudoBottomSheet}>
              <View style={styles.dragHandle} />
              <View style={styles.modalCabecalho}>
                <Text style={styles.modalTitulo}>{idEditando ? 'Editar Lançamento' : 'Novo Lançamento'}</Text>
                <TouchableOpacity onPress={fecharModal}><Feather name="x-circle" size={24} color="#64748B" /></TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                {novoTipo === 'saida' && ( 
                  <View style={{ marginTop: 5, marginBottom: 15 }}>
                    <View style={styles.linhaBotoesOpcao}>
                      <TouchableOpacity style={[styles.opcaoBtn, novaModalidade === 'a_vista' && styles.opcaoBtnAtivo]} onPress={() => setNovaModalidade('a_vista')}><Text style={[styles.textoOpcao, novaModalidade === 'a_vista' && styles.textoBranco]}>À Vista</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.opcaoBtn, novaModalidade === 'parcelada' && styles.opcaoBtnAtivo]} onPress={() => setNovaModalidade('parcelada')}><Text style={[styles.textoOpcao, novaModalidade === 'parcelada' && styles.textoBranco]}>Parcelado</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.opcaoBtn, novaModalidade === 'fixa' && styles.opcaoBtnAtivo]} onPress={() => setNovaModalidade('fixa')}><Text style={[styles.textoOpcao, novaModalidade === 'fixa' && styles.textoBranco]}>Mensal</Text></TouchableOpacity>
                    </View>
                  </View>
                )}

                <Text style={styles.label}>O que foi?</Text>
                <TextInput style={styles.inputClean} placeholder="Ex: Mercado, #viagem..." value={novaDescricao} onChangeText={setNovaDescricao} />
                
                <Text style={styles.label}>Categoria</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
                  {categorias.map((cat) => (
                    <TouchableOpacity key={cat.id} style={[styles.pillCategoria, novaCategoriaForm === cat.nome && { backgroundColor: cat.cor }]} onPress={() => setNovaCategoriaForm(cat.nome)}>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={[styles.textoPill, novaCategoriaForm === cat.nome && styles.textoBranco]}>{cat.icone} {cat.nome}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.linhaDupla}>
                  <View style={novaModalidade === 'parcelada' && novoTipo === 'saida' ? { width: '58%' } : { width: '100%' }}>
                    <Text style={styles.label}>{novaModalidade === 'parcelada' && novoTipo === 'saida' ? 'Valor Total (R$)' : 'Valor (R$)'}</Text>
                    <TextInput style={styles.inputClean} placeholder="0.00" keyboardType="numeric" value={novoValor} onChangeText={setNovoValor} />
                  </View>
                  {novaModalidade === 'parcelada' && novoTipo === 'saida' && (
                    <View style={{ width: '38%' }}>
                      <Text style={styles.label}>Parcelas</Text>
                      <TextInput style={styles.inputClean} placeholder="Ex: 3" keyboardType="numeric" value={qtdParcelas} onChangeText={setQtdParcelas} />
                    </View>
                  )}
                </View>

                {novaModalidade === 'parcelada' && novoTipo === 'saida' && novoValor !== '' && (
                  <Text style={styles.calculoParcelaTexto}>💡 {qtdParcelas || 2}x de R$ {(parseFloat(novoValor.replace(',', '.') || 0) / (parseInt(qtdParcelas, 10) || 2)).toFixed(2)} por mês</Text>
                )}

                {novoTipo === 'saida' ? (
                  novaModalidade === 'fixa' ? (
                    <View style={styles.avisoFixaContainer}><Text style={styles.avisoFixaTexto}>💡 A despesa começará automaticamente em {nomesMeses[mesSelecionado.split('/')[0]]}/{mesSelecionado.split('/')[1]}</Text></View>
                  ) : (
                    <View style={styles.linhaDupla}>
                      <View style={styles.metadeInput}>
                        <Text style={styles.label}>Data da Compra</Text>
                        <TouchableOpacity style={styles.inputDataBtnClean} onPress={() => abrirCalendario('compra')}><Text style={styles.inputDataTexto}>{novaDataCompra || 'Selecionar 📅'}</Text></TouchableOpacity>
                      </View>
                      <View style={styles.metadeInput}>
                        <Text style={styles.label}>Vencimento</Text>
                        <TouchableOpacity style={styles.inputDataBtnClean} onPress={() => abrirCalendario('vencimento')}><Text style={styles.inputDataTexto}>{novaDataVencimento || 'Selecionar 📅'}</Text></TouchableOpacity>
                      </View>
                    </View>
                  )
                ) : (
                  <View style={{ width: '100%' }}>
                    <Text style={styles.label}>Data do Crédito</Text>
                    <TouchableOpacity style={styles.inputDataBtnClean} onPress={() => abrirCalendario('compra')}><Text style={styles.inputDataTexto}>{novaDataCompra || 'Selecionar 📅'}</Text></TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={styles.botaoSalvarGrande} onPress={salvarTransacao}>
                  <Text style={styles.textoBotaoSalvarGrande}>{idEditando ? 'Atualizar Registro' : 'Salvar Transação'}</Text>
                </TouchableOpacity>
                <View style={{height: 40}}/>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal animationType="slide" transparent={true} visible={modalCategoriasVisivel} onRequestClose={() => setModalCategoriasVisivel(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalFundoBottomSheet}>
            <View style={[styles.modalConteudoBottomSheet, { maxHeight: '90%' }]}>
              <View style={styles.dragHandle} />
              <View style={styles.modalCabecalho}>
                <Text style={styles.modalTitulo}>Categorias & Ícones</Text>
                <TouchableOpacity onPress={() => setModalCategoriasVisivel(false)}><Feather name="x-circle" size={24} color="#64748B" /></TouchableOpacity>
              </View>
              
              <Text style={styles.labelPequeno}>Ícone (Emoji do iPhone):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15, paddingVertical: 5}}>
                {iconesDisponiveis.map(ic => (
                  <TouchableOpacity key={ic} style={[styles.iconePill, novaCategoriaIcone === ic && styles.iconePillAtivo]} onPress={() => setNovaCategoriaIcone(ic)}>
                    <Text style={{fontSize: 22}}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.labelPequeno}>Nome da Nova Categoria:</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
                <TextInput style={[styles.inputClean, {flex: 1, marginRight: 10, paddingVertical: 12}]} placeholder="Ex: Faculdade" value={novaCategoriaNome} onChangeText={setNovaCategoriaNome} />
                <TouchableOpacity style={styles.btnAdicionarCategoria} onPress={adicionarCategoria}><Feather name="plus" size={24} color="#FFF" /></TouchableOpacity>
              </View>

              <Text style={styles.labelPequeno}>Escolha a Cor Principal:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
                {coresDisponiveis.map(cor => (<TouchableOpacity key={cor} style={[styles.bolinhaCor, {backgroundColor: cor}, novaCategoriaCor === cor && styles.bolinhaCorAtiva]} onPress={() => setNovaCategoriaCor(cor)} />))}
              </ScrollView>

              <Text style={styles.labelPequeno}>Categorias Existentes:</Text>
              <FlatList data={categorias} keyExtractor={item => item.id} style={{maxHeight: 250}} renderItem={({item}) => (
                <View style={styles.catEditRow}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={[styles.catIconContainerPequeno, { backgroundColor: item.cor + '20', marginRight: 12 }]}><Text style={{fontSize: 16}}>{item.icone || '🏷️'}</Text></View>
                    <Text style={styles.catEditNome}>{item.nome}</Text>
                  </View>
                  <TouchableOpacity onPress={() => excluirCategoria(item.id, item.nome)} style={{padding: 5}}><Feather name="trash-2" size={20} color="#EF4444" /></TouchableOpacity>
                </View>
              )} />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* --- O NOVO CALENDÁRIO COM OS DIAS DA SEMANA ESTÁ AQUI --- */}
        {calendarioVisivel && (
          <View style={styles.calendarioOverlay}>
            <View style={styles.calendarioBox}>
              <View style={styles.calTopo}>
                <TouchableOpacity onPress={() => setCalMes(calMes === 1 ? 12 : calMes - 1)}><Text style={styles.calSeta}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.calTitulo}>{nomesMeses[calMes.toString().padStart(2, '0')]} {calAno}</Text>
                <TouchableOpacity onPress={() => setCalMes(calMes === 12 ? 1 : calMes + 1)}><Text style={styles.calSeta}>{'>'}</Text></TouchableOpacity>
              </View>
              
              <View style={styles.gridDiasSemana}>
                {arrayDiasSemana.map(d => <Text key={d} style={styles.diaSemanaTexto}>{d}</Text>)}
              </View>
              
              <View style={styles.gridDias}>
                {arrayDiasCompletos.map((diaItem, idx) => {
                  if (typeof diaItem === 'string') return <View key={idx} style={styles.diaItem} />;
                  return (
                    <TouchableOpacity key={idx} style={styles.diaItem} onPress={() => selecionarDia(diaItem)}>
                      <Text style={styles.diaTexto}>{diaItem}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <TouchableOpacity style={styles.btnFecharCal} onPress={() => setCalendarioVisivel(false)}><Text style={styles.textoFecharCal}>Cancelar</Text></TouchableOpacity>
            </View>
          </View>
        )}

        <Modal visible={menuAberto} transparent={true} animationType="fade" onRequestClose={() => setMenuAberto(false)}>
          <View style={styles.drawerOverlay}>
            <View style={styles.drawerContent}>
              <View style={styles.drawerHeader}>
                <View style={styles.avatarPlaceholder}><Feather name="user" size={32} color="#FFF" /></View>
                <Text style={styles.drawerName}>App Finanças</Text>
                <Text style={styles.drawerSubtitle}>Gestão Inteligente</Text>
              </View>
              <ScrollView>
                <TouchableOpacity style={styles.drawerItem} onPress={async () => { await supabase.auth.signOut(); }}><Feather name="log-out" size={22} color="#EF4444" /><Text style={[styles.drawerItemText, {color: '#EF4444'}]}>Sair da Conta</Text></TouchableOpacity>
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.drawerCloseArea} activeOpacity={1} onPress={() => setMenuAberto(false)} />
          </View>
        </Modal>

        <Modal visible={menuAdicionarVisivel} transparent={true} animationType="slide" onRequestClose={() => setMenuAdicionarVisivel(false)}><TouchableOpacity style={styles.modalAdicionarOverlay} activeOpacity={1} onPress={() => setMenuAdicionarVisivel(false)}><View style={styles.menuAdicionarContent}><View style={styles.menuAdicionarHeader}><Text style={styles.menuAdicionarTitle}>O que deseja registrar?</Text></View><View style={styles.menuAdicionarBotoes}><TouchableOpacity style={styles.menuAdicionarOpcao} onPress={() => escolherTipoTransacao('saida')}><View style={[styles.iconBoxAdicionar, { backgroundColor: '#FEF2F2' }]}><Feather name="arrow-down" size={28} color="#B91C1C" /></View><Text style={styles.menuAdicionarTexto}>Despesa</Text></TouchableOpacity><TouchableOpacity style={styles.menuAdicionarOpcao} onPress={() => escolherTipoTransacao('entrada')}><View style={[styles.iconBoxAdicionar, { backgroundColor: '#F0FDF4' }]}><Feather name="arrow-up" size={28} color="#15803D" /></View><Text style={styles.menuAdicionarTexto}>Receita</Text></TouchableOpacity></View></View></TouchableOpacity></Modal>
        <Modal animationType="fade" transparent={true} visible={modalMesVisivel} onRequestClose={() => setModalMesVisivel(false)}><View style={styles.modalFundoCentro}><View style={styles.calendarioBox}><View style={styles.calTopo}><TouchableOpacity onPress={() => setAnoTemp(anoTemp - 1)}><Text style={styles.calSeta}>{'<'}</Text></TouchableOpacity><Text style={styles.calTitulo}>{anoTemp}</Text><TouchableOpacity onPress={() => setAnoTemp(anoTemp + 1)}><Text style={styles.calSeta}>{'>'}</Text></TouchableOpacity></View><View style={styles.gridMeses}>{mesesAbreviados.map((mes) => { const isSelecionado = mesSelecionado === `${mes.num.toString().padStart(2, '0')}/${anoTemp}`; return (<TouchableOpacity key={mes.num} style={[styles.mesItem, isSelecionado && styles.mesItemAtivo]} onPress={() => escolherMes(mes.num)}><Text style={[styles.mesItemTexto, isSelecionado && styles.mesItemTextoAtivo]}>{mes.nome}</Text></TouchableOpacity>);})}</View><TouchableOpacity style={styles.btnFecharCal} onPress={() => setModalMesVisivel(false)}><Text style={styles.textoFecharCal}>Cancelar</Text></TouchableOpacity></View></View></Modal>
        
        <Modal animationType="slide" transparent={true} visible={modalImportarVisivel} onRequestClose={() => setModalImportarVisivel(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalFundoBottomSheet}>
            <View style={[styles.modalConteudoBottomSheet, { maxHeight: '90%' }]}>
              <View style={styles.dragHandle} />
              <View style={styles.modalCabecalho}>
                <Text style={styles.modalTitulo}>Importador CSV</Text>
                <TouchableOpacity onPress={() => setModalImportarVisivel(false)}><Feather name="x-circle" size={24} color="#64748B" /></TouchableOpacity>
              </View>
              <TextInput style={[styles.inputClean, { height: 120, textAlignVertical: 'top', fontSize: 13 }]} multiline={true} placeholder="Data da Compra ; Descrição ; Parcela (01/02) ; Valor Parcela ; Valor Total" value={conteudoCsvInput} onChangeText={setConteudoCsvInput} />
              <TouchableOpacity style={[styles.botaoSalvarGrande, { backgroundColor: '#10B981', marginTop: 10 }]} onPress={() => processarTextoCsv(conteudoCsvInput)}>
                <Text style={styles.textoBotaoSalvarGrande}>Processar Ciclo de Parcelas</Text>
              </TouchableOpacity>
              {transacoesPreview.length > 0 && (
                <View style={{ marginTop: 15, flex: 1 }}>
                  <Text style={[styles.label, { color: '#10B981', fontWeight: 'bold' }]}>Prévia Inteligente ({transacoesPreview.length} parcelas):</Text>
                  <ScrollView style={{ maxHeight: 180, backgroundColor: '#F1F5F9', borderRadius: 10, padding: 10 }}>
                    {transacoesPreview.map((item, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                        <View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1E293B' }}>{item.descricao}</Text><Text style={{ fontSize: 11, color: '#64748B' }}>📅 Venc: {item.dataVencimento}</Text></View>
                        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}><Text style={{ fontSize: 13, fontWeight: 'bold', color: item.tipo === 'entrada' ? '#15803D' : '#B91C1C' }}>- R$ {item.valor.toFixed(2)}</Text></View>
                      </View>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={[styles.botaoSalvarGrande, { marginTop: 15 }]} onPress={confirmarImportacaoLote}><Text style={styles.textoBotaoSalvarGrande}>Confirmar e Inserir no Extrato</Text></TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flex: 1, backgroundColor: '#FAFAFA' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#FFFFFF' },
  topBarTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  topBarIcon: { padding: 5 },
  notificationBadge: { position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFFFFF' },
  
  // DASHBOARD STYLES
  donutContainer: { alignItems: 'center', marginVertical: 20 },
  donutWrapper: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center' },
  donutRingBackground: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 15 },
  donutRingForeground: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 15, borderLeftColor: 'transparent', borderBottomColor: 'transparent' },
  donutInner: { justifyContent: 'center', alignItems: 'center' },
  donutSubText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  donutMainText: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  donutLegenda: { marginTop: 15, fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  
  statusPagamentoContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 25 },
  pagamentoCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 15, borderRadius: 16, borderLeftWidth: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  pagamentoLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  pagamentoValor: { fontSize: 18, fontWeight: 'bold' },
  
  catRowAdvanced: { marginBottom: 15 },
  catRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catLeftInfo: { flexDirection: 'row', alignItems: 'center' },
  catIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  catIconContainerPequeno: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  catEmoji: { fontSize: 18 },
  catNomeAdvanced: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
  catRightInfo: { alignItems: 'flex-end' },
  catValorAdvanced: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  catPercentAdvanced: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  catProgressBarBg: { width: '100%', height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  catProgressBarFill: { height: '100%', borderRadius: 3 },
  
  // MODAIS BOTTOM SHEET
  modalFundoBottomSheet: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalConteudoBottomSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '92%' },
  dragHandle: { width: 50, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  inputClean: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  inputDataBtnClean: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, alignItems: 'center' },
  botaoSalvarGrande: { backgroundColor: '#3B82F6', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 25, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  textoBotaoSalvarGrande: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  iconePill: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 16, marginRight: 10, borderWidth: 2, borderColor: 'transparent' },
  iconePillAtivo: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  
  // CALENDÁRIO COM DIAS DA SEMANA
  gridDiasSemana: { flexDirection: 'row', width: '100%', marginBottom: 10 },
  diaSemanaTexto: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 'bold', color: '#94A3B8' },

  // GERAIS
  monthSelectorContainer: { paddingHorizontal: 20, marginTop: 10, marginBottom: 15, alignItems: 'center' },
  monthPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  monthPillText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  cardsContainer: { paddingHorizontal: 20, gap: 12, marginBottom: 25 },
  summaryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16 },
  summaryLabel: { fontSize: 13, fontWeight: '600', marginBottom: 5 },
  summaryValue: { fontSize: 22, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  chartSection: { paddingHorizontal: 20, paddingBottom: 10 },
  chartBox: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  chartLabel: { fontSize: 14, color: '#64748B', marginBottom: 15, textAlign: 'center' },
  barraFundo: { width: '100%', height: 16, backgroundColor: '#10B981', borderRadius: 8, overflow: 'hidden' },
  barraProgresso: { height: '100%', backgroundColor: '#EF4444', borderRadius: 8 },
  categoriasSection: { paddingHorizontal: 20, paddingBottom: 20, marginTop: 10 },
  categoriasListContainer: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  extratoContainer: { flex: 1, backgroundColor: '#FAFAFA' },
  extratoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 5 },
  extratoTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  extratoSubtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
  btnExportar: { flexDirection: 'row', backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnExportarText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
  extratoMonthSelector: { alignItems: 'flex-start', paddingHorizontal: 20, marginVertical: 10 },
  textoVazio: { textAlign: 'center', color: '#94A3B8', marginTop: 30, fontSize: 15 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', position: 'absolute', bottom: 0, width: '100%', zIndex: 10 },
  navItem: { alignItems: 'center', flex: 1 },
  navText: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  navTextAtivo: { color: '#3B82F6', fontWeight: 'bold' },
  fabWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabBtn: { backgroundColor: '#3B82F6', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 30, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  cardFixado: { borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  listCardInfo: { flex: 1 },
  listCardTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  listCardValue: { fontSize: 16, fontWeight: 'bold' },
  dataVencimentoText: { fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
  verde: { color: '#10B981' },
  vermelho: { color: '#F43F5E' },
  swipeable: { borderRadius: 16, overflow: 'hidden' },
  rightActions: { flexDirection: 'row' },
  leftActions: { flexDirection: 'row' },
  btnEditar: { backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', width: 75, height: '100%' },
  btnExcluir: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', width: 75, height: '100%' },
  btnFixar: { backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', width: 100, height: '100%' },
  textoAcao: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  modalCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  label: { fontSize: 15, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 15 },
  labelPequeno: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8, marginTop: 10 },
  linhaDupla: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metadeInput: { width: '48%' },
  linhaBotoesOpcao: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 4 },
  opcaoBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  opcaoBtnAtivo: { backgroundColor: '#3B82F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  textoOpcao: { fontSize: 13, fontWeight: 'bold', color: '#64748B' },
  textoBranco: { color: '#FFFFFF' },
  calculoParcelaTexto: { color: '#3B82F6', fontSize: 13, fontWeight: '600', marginTop: 6 },
  listaCategorias: { flexDirection: 'row', marginBottom: 5 },
  pillCategoria: { backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  textoPill: { fontSize: 14, fontWeight: '600', color: '#475569' },
  inputDataTexto: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
  calendarioOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  calendarioBox: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, alignItems: 'center' },
  calTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 15 },
  calSeta: { fontSize: 24, fontWeight: 'bold', color: '#3B82F6', paddingHorizontal: 10 },
  calTitulo: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  gridDias: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%' },
  diaItem: { width: '14.2%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
  diaTexto: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
  btnFecharCal: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#F1F5F9', borderRadius: 12 },
  textoFecharCal: { color: '#64748B', fontWeight: 'bold', fontSize: 14 },
  menuAdicionarContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: Platform.OS === 'ios' ? 50 : 30, alignItems: 'center' },
  menuAdicionarHeader: { marginBottom: 25 },
  menuAdicionarTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  menuAdicionarBotoes: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  menuAdicionarOpcao: { alignItems: 'center', flex: 1 },
  iconBoxAdicionar: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  menuAdicionarTexto: { fontSize: 15, fontWeight: '600', color: '#334155' },
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
  drawerContent: { width: '75%', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10, zIndex: 2 },
  drawerCloseArea: { flex: 1 },
  drawerHeader: { backgroundColor: '#1E293B', paddingTop: 60, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 4, borderColor: '#FAFAFA' },
  drawerName: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  drawerSubtitle: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 25, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  drawerItemText: { marginLeft: 15, fontSize: 16, color: '#334155', fontWeight: '600' },
  btnAdicionarCategoria: { backgroundColor: '#3B82F6', width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  bolinhaCor: { width: 36, height: 36, borderRadius: 18, marginHorizontal: 6, borderWidth: 3, borderColor: 'transparent' },
  bolinhaCorAtiva: { borderColor: '#1E293B', transform: [{ scale: 1.1 }] },
  catEditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  catEditNome: { fontSize: 16, color: '#1E293B', fontWeight: '600' },
  grupoContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  grupoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF' },
  grupoTitulo: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', marginLeft: 10 },
  grupoQtd: { fontSize: 14, color: '#94A3B8', marginLeft: 6 },
  grupoTotal: { fontSize: 17, fontWeight: 'bold' },
  grupoConteudo: { backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#F1F5F9', padding: 12 },
  cardContainerGrouped: { marginBottom: 10 },
  listCardGrouped: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
});

export default function App() {
  const [session, setSession] = React.useState(null);
  const [emailAuth, setEmailAuth] = React.useState('');
  const [passwordAuth, setPasswordAuth] = React.useState('');
  const [loadingAuth, setLoadingAuth] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  async function handleSignUp() {
    setLoadingAuth(true);
    const { error } = await supabase.auth.signUp({ email: emailAuth, password: passwordAuth });
    if (error) alert('Erro ao criar conta: ' + error.message);
    else alert('Conta criada com sucesso! Já pode entrar.');
    setLoadingAuth(false);
  }

  async function handleLogin() {
    setLoadingAuth(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailAuth, password: passwordAuth });
    if (error) alert('Erro ao entrar: ' + error.message);
    setLoadingAuth(false);
  }

  if (!session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8fafc' }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#1e293b' }}>
          App Finanças
        </Text>
        <TextInput
          style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#cbd5e1', fontSize: 16 }}
          placeholder="E-mail"
          value={emailAuth}
          onChangeText={setEmailAuth}
          autoCapitalize="none"
        />
        <TextInput
          style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#cbd5e1', fontSize: 16 }}
          placeholder="Senha"
          value={passwordAuth}
          onChangeText={setPasswordAuth}
          secureTextEntry
        />
        <TouchableOpacity onPress={handleLogin} style={{ backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, marginBottom: 15, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
            {loadingAuth ? 'A processar...' : 'Entrar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignUp} style={{ padding: 15 }}>
          <Text style={{ color: '#3B82F6', textAlign: 'center', fontWeight: 'bold', fontSize: 15 }}>Criar Nova Conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <MainApp session={session} />;
}
