// ======================================================
//             ARQUIVO: app.js
// ======================================================

// -----------------------------------------------------------------
// PASSO 1: "BANCO DE DADOS" E VARIÁVEIS GLOBAIS
// -----------------------------------------------------------------
let athletes = [];
let tournamentActive = false;
let tournamentData = {}; // Estrutura: { category: { groups: [], matches: [], standings: {}, elimination: "...", knockoutKey: "...", knockoutRounds: { roundName: [matchObj, ...] }, info: "...", numAthletes: N, ranking: [] } }

const knockoutPairings = {
    '2_groups': [ { p1_source: '1A', p2_source: '2B' }, { p1_source: '1B', p2_source: '2A' } ],
    '4_groups': [ { p1_source: '1A', p2_source: '2D' }, { p1_source: '1C', p2_source: '2B' }, { p1_source: '1B', p2_source: '2C' }, { p1_source: '1D', p2_source: '2A' } ],
    '8_groups': [
        { p1_source: '1A', p2_source: '2H' }, { p1_source: '1G', p2_source: '2B' }, { p1_source: '1D', p2_source: '2E' }, { p1_source: '1F', p2_source: '2C' },
        { p1_source: '1B', p2_source: '2G' }, { p1_source: '1H', p2_source: '2A' }, { p1_source: '1C', p2_source: '2F' }, { p1_source: '1E', p2_source: '2D' }
    ]
};
// Pontos BASE (do Ranking)
const rankingPointsConfig = {
    '12': { "Campeão": 265, "Vice-Campeão": 260, "Semifinal": 250, "Quartas": 235, "Classificação": 215, "Fase de Grupos": 190 },
    '16': { "Campeão": 265, "Vice-Campeão": 260, "Semifinal": 250, "Quartas": 235, "Oitavas": 215, "Classificação": 190, "Fase de Grupos": 190 },
    '24': { "Campeão": 265, "Vice-Campeão": 260, "Semifinal": 250, "Quartas": 235, "Oitavas": 215, "Classificação": 190, "Fase de Grupos": 190 }
};

// =========================================================================
// !! IMPORTANTE !! Substitua a string abaixo pela Base64 da sua imagem ctb.png
// Pode usar um conversor online como: https://www.base64-image.de/
// O código atual contém uma imagem placeholder minúscula.
// =========================================================================
const ctbLogoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // <-- COLOQUE A SUA BASE64 AQUI!


// -----------------------------------------------------------------
// PASSO 2: FUNÇÃO DE NAVEGAÇÃO E UTILS
// -----------------------------------------------------------------
function showPage(pageId){document.querySelectorAll('.page').forEach(page=>page.classList.remove('active'));document.getElementById(pageId)?.classList.add('active');document.querySelectorAll('.nav-btn').forEach(btn=>{btn.classList.remove('active');if(btn.getAttribute('onclick')===`showPage('${pageId}')`)btn.classList.add('active');});if(pageId==='grupos')populateGroupCategorySelector();else if(pageId==='jogos'){populateGamesCategorySelector();renderGroupMatchesAndStandings();}else if(pageId==='eliminatorias'){populateKnockoutCategorySelector();renderKnockoutBracket();}else if(pageId==='ranking'){populateRankingCategorySelector();renderRanking();}}
function getCategoryDisplayName(categoryKey){const names={sub13:'Sub 13',sub15:'Sub 15',sub19:'Sub 19',adultoA:'Adulto A',adultoB:'Adulto B',veterano:'Veterano',feminino:'Feminino'};return names[categoryKey]||categoryKey;}
function createAlertElement(message,type='alert-info'){const alertDiv=document.createElement('div');alertDiv.className=`alert ${type}`;alertDiv.textContent=message;return alertDiv;}

// -----------------------------------------------------------------
// PASSO 3: FUNÇÕES DA PÁGINA "CADASTRO" (Compactado)
// -----------------------------------------------------------------
function addAthlete(){if(tournamentActive){alert('Erro: Não é possível cadastrar atletas após o início do torneio.');return;}const name=document.getElementById('athleteName').value.trim();const ranking=parseInt(document.getElementById('athleteRanking').value);const category=document.getElementById('athleteCategory').value;if(name===''){alert('Erro: Por favor, digite o nome do atleta.');return;}if(isNaN(ranking)||ranking<=0){alert('Erro: Por favor, digite um ranking inicial válido (maior que 0).');return;}const duplicateRanking=athletes.find(a=>a.category===category&&a.ranking===ranking);if(duplicateRanking){alert(`Erro: Já existe um atleta (${duplicateRanking.name}) com o ranking ${ranking} na categoria ${category}.`);return;}const newAthlete={id:Date.now(),name:name,ranking:ranking,category:category};athletes.push(newAthlete);alert(`Atleta ${name} cadastrado com sucesso na categoria ${category}!`);document.getElementById('athleteName').value='';document.getElementById('athleteRanking').value=1;document.getElementById('athleteName').focus();updateDashboardCounts();renderAthletesTable();}
function renderAthletesTable(){const tableBody=document.getElementById('athletes-table-body');const table=document.getElementById('athletes-table');const warning=document.getElementById('no-athletes-warning');tableBody.innerHTML='';if(athletes.length===0){table.style.display='none';warning.style.display='block';return;}table.style.display='table';warning.style.display='none';const sortedAthletes=[...athletes].sort((a,b)=>{if(a.category<b.category)return-1;if(a.category>b.category)return 1;return a.ranking-b.ranking;});sortedAthletes.forEach(athlete=>{const categoryName=getCategoryDisplayName(athlete.category);const row=`<tr><td>${athlete.name}</td><td>${categoryName}</td><td>${athlete.ranking}</td><td><button class="btn btn-danger" style="padding: 5px 10px;" onclick="removeAthlete(${athlete.id})">X</button></td></tr>`;tableBody.innerHTML+=row;});}
function removeAthlete(athleteId){if(tournamentActive){alert('Erro: Não é possível remover atletas após o início do torneio.');return;}if(confirm('Tem certeza que deseja remover este atleta?')){athletes=athletes.filter(athlete=>athlete.id!==athleteId);renderAthletesTable();updateDashboardCounts();}}

// -----------------------------------------------------------------
// PASSO 4: FUNÇÕES DA PÁGINA "INÍCIO" (DASHBOARD) (Compactado)
// -----------------------------------------------------------------
function updateDashboardCounts(){const counts={sub13:0,sub15:0,sub19:0,adultoA:0,adultoB:0,veterano:0,feminino:0};athletes.forEach(athlete=>{if(counts.hasOwnProperty(athlete.category)){counts[athlete.category]++;}});Object.keys(counts).forEach(key=>{const element=document.getElementById(`count-${key}`);if(element)element.textContent=`Atletas: ${counts[key]}`;});}
function startTournament(){if(athletes.length===0){alert('Erro: Cadastre pelo menos um atleta antes de iniciar o torneio.');return;}if(confirm('Deseja realmente iniciar o torneio? O cadastro de novos atletas será bloqueado.')){tournamentActive=true;const statusBadge=document.getElementById('tournamentStatus');statusBadge.textContent='Em Andamento';statusBadge.classList.remove('status-inactive');statusBadge.classList.add('status-active');document.getElementById('athleteName').disabled=true;document.getElementById('athleteRanking').disabled=true;document.getElementById('athleteCategory').disabled=true;alert('Torneio iniciado! Boa sorte a todos os atletas!');showPage('grupos');}}
function finalizeTournament(){if(!confirm("Tem certeza que deseja finalizar o torneio?"))return;tournamentActive=false;const statusBadge=document.getElementById('tournamentStatus');statusBadge.textContent='Finalizado';statusBadge.classList.remove('status-active');statusBadge.classList.add('status-inactive');alert('Torneio finalizado! Verifique o Ranking.');showPage('ranking');}
function resetTournament(){if(confirm('ATENÇÃO! Tem certeza? Isso apagará TODOS os dados (atletas, grupos, jogos) e reiniciará o sistema. Esta ação não pode ser desfeita.')){athletes=[];tournamentActive=false;tournamentData={};const statusBadge=document.getElementById('tournamentStatus');statusBadge.textContent='Não Iniciado';statusBadge.classList.remove('status-active');statusBadge.classList.add('status-inactive');document.getElementById('athleteName').disabled=false;document.getElementById('athleteRanking').disabled=false;document.getElementById('athleteCategory').disabled=false;document.getElementById('athleteName').value='';document.getElementById('athleteRanking').value=1;updateDashboardCounts();renderAthletesTable();document.getElementById('group-display-area').innerHTML='';document.getElementById('group-info-area').innerHTML='';document.getElementById('games-display-area').innerHTML='';document.getElementById('games-standings-area').innerHTML='';document.getElementById('knockout-display-area').innerHTML='';document.getElementById('ranking-display-area').innerHTML='';const saveGroupsBtn=document.getElementById('save-groups-pdf-btn');if(saveGroupsBtn)saveGroupsBtn.style.display='none';const generateScoresheetsBtn=document.getElementById('generate-scoresheets-btn');if(generateScoresheetsBtn)generateScoresheetsBtn.style.display='none';const finalizeBtn=document.getElementById('finalize-groups-btn');if(finalizeBtn)finalizeBtn.style.display='none';const saveRankingBtn=document.getElementById('save-ranking-pdf-btn');if(saveRankingBtn)saveRankingBtn.style.display='none';alert('Sistema resetado! Pronto para um novo torneio.');showPage('home');}}

// -----------------------------------------------------------------
// PASSO 5: FUNÇÕES DA PÁGINA "GRUPOS" (Compactado)
// -----------------------------------------------------------------
function populateGroupCategorySelector(){const select=document.getElementById('group-category-select');select.innerHTML='';const categoriesInUse=[...new Set(athletes.map(a=>a.category))];const saveBtn=document.getElementById('save-groups-pdf-btn');if(categoriesInUse.length===0){select.innerHTML='<option value="">-- Nenhum atleta cadastrado --</option>';saveBtn.style.display='none';return;}select.innerHTML='<option value="">-- Selecione uma categoria --</option>';categoriesInUse.forEach(category=>{const categoryName=getCategoryDisplayName(category);select.innerHTML+=`<option value="${category}">${categoryName}</option>`;});saveBtn.style.display='none';}
function generateGroups(){if(!tournamentActive){alert('Erro: Você deve "Iniciar o Torneio" na página Início antes de gerar os grupos.');return;}const selectedCategory=document.getElementById('group-category-select').value;if(!selectedCategory){alert('Erro: Selecione uma categoria válida.');return;}const displayArea=document.getElementById('group-display-area');const infoArea=document.getElementById('group-info-area');const saveBtn=document.getElementById('save-groups-pdf-btn');displayArea.innerHTML='';infoArea.innerHTML='';tournamentData[selectedCategory]={};const categoryAthletes=athletes.filter(a=>a.category===selectedCategory).sort((a,b)=>a.ranking-b.ranking);const n=categoryAthletes.length;let numGroups=0,infoMessage="",eliminationPhase="",knockoutKey="";if(n<3){infoArea.appendChild(createAlertElement('Erro: A categoria precisa de no mínimo 3 atletas para acontecer.','alert-danger'));saveBtn.style.display='none';return;}else if(n===3){numGroups=1;eliminationPhase="Nenhum (Round Robin)";infoMessage=`Formato: ${n} atletas. Grupo Único. Todos jogam contra todos.`;knockoutKey="1_group";}else if(n>=4&&n<=7){numGroups=2;eliminationPhase="Semifinal";infoMessage=`Formato: ${n} atletas em ${numGroups} grupos. Os 2 melhores de cada grupo avançam para a ${eliminationPhase}.`;knockoutKey="2_groups";}else if(n>=8&&n<=15){numGroups=4;eliminationPhase="Quartas de Final";infoMessage=`Formato: ${n} atletas em ${numGroups} grupos. Os 2 melhores de cada grupo avançam para as ${eliminationPhase}.`;knockoutKey="4_groups";}else if(n>=16&&n<=24){numGroups=8;eliminationPhase="Oitavas de Final";infoMessage=`Formato: ${n} atletas em ${numGroups} grupos. Os 2 melhores de cada grupo avançam para as ${eliminationPhase}.`;knockoutKey="8_groups";}else{infoArea.appendChild(createAlertElement(`Erro: O sistema (baseado no regulamento) suporta um máximo de 24 atletas. Esta categoria tem ${n}.`,'alert-danger'));saveBtn.style.display='none';return;}infoArea.appendChild(createAlertElement(infoMessage,'alert-info'));const generatedGroups=distributeSnake(categoryAthletes,numGroups);const generatedMatches=generateGroupMatches(generatedGroups);tournamentData[selectedCategory]={groups:generatedGroups,matches:generatedMatches,standings:{},elimination:eliminationPhase,knockoutKey:knockoutKey,knockoutRounds:{},info:infoMessage,numAthletes:n};renderGroups(generatedGroups,displayArea);populateGamesCategorySelector();saveBtn.style.display='inline-block';}
function distributeSnake(athletesSorted,numGroups){const groups=Array.from({length:numGroups},()=>[]);athletesSorted.forEach((athlete,index)=>{const round=Math.floor(index/numGroups);const positionInRound=index%numGroups;let groupIndex=(round%2===0)?positionInRound:(numGroups-1)-positionInRound;groups[groupIndex].push(athlete);});return groups;}
function renderGroups(groups,displayArea){if(!groups||groups.length===0)return;groups.forEach((group,index)=>{if(group.length===0)return;const groupLetter=(groups.length>1)?String.fromCharCode(65+index):"Único";const playersHtml=group.map(player=>`<li><span>${player.name}</span> <small>(Rank: ${player.ranking})</small></li>`).join('');const groupCardHtml=`<div class="group-bracket"><h3>Grupo ${groupLetter}</h3><ul class="group-player-list">${playersHtml}</ul></div>`;displayArea.innerHTML+=groupCardHtml;});}

// -----------------------------------------------------------------
// PASSO 6: FUNÇÕES DA PÁGINA "JOGOS GRUPO"
// -----------------------------------------------------------------
function populateGamesCategorySelector(){const select=document.getElementById('games-category-select');const currentSelection=select.value;select.innerHTML='';const categoriesWithGroups=Object.keys(tournamentData).filter(key=>tournamentData[key].groups&&tournamentData[key].groups.length>0);const generateSumBtn=document.getElementById('generate-scoresheets-btn');const finalizeBtn=document.getElementById('finalize-groups-btn');if(categoriesWithGroups.length===0){select.innerHTML='<option value="">-- Nenhum grupo gerado --</option>';generateSumBtn.style.display='none';finalizeBtn.style.display='none';return;}select.innerHTML='<option value="">-- Selecione a categoria --</option>';categoriesWithGroups.forEach(category=>{const categoryName=getCategoryDisplayName(category);const isSelected=category===currentSelection?'selected':'';select.innerHTML+=`<option value="${category}" ${isSelected}>${categoryName}</option>`;});if(currentSelection&&tournamentData[currentSelection]){generateSumBtn.style.display='inline-block';finalizeBtn.style.display='inline-block';}else{generateSumBtn.style.display='none';finalizeBtn.style.display='none';}}
function generateGroupMatches(groups){let allMatches=[];groups.forEach((group,index)=>{const groupName=(groups.length>1)?String.fromCharCode(65+index):"Único";const sortedPlayers=[...group].sort((a,b)=>a.ranking-b.ranking);const n=sortedPlayers.length;const p=sortedPlayers;let groupMatches=[];const createMatch=(p1,p2,matchIndex)=>(p1&&p2?{id:`m_${p1.id}_${p2.id}`,type:'group',group:groupName,matchNumber:matchIndex+1,p1:p1,p2:p2,sets:[],finalScore1:null,finalScore2:null,pointsPro1:0,pointsPro2:0,points1:0,points2:0,wo:false,done:false}:null);if(n===3){groupMatches.push(createMatch(p[0],p[2],1));groupMatches.push(createMatch(p[1],p[2],2));groupMatches.push(createMatch(p[0],p[1],3));}else if(n===4){groupMatches.push(createMatch(p[0],p[3],1));groupMatches.push(createMatch(p[1],p[2],2));groupMatches.push(createMatch(p[0],p[2],3));groupMatches.push(createMatch(p[1],p[3],4));groupMatches.push(createMatch(p[0],p[1],5));groupMatches.push(createMatch(p[2],p[3],6));}else if(n>1){let k=1;for(let i=0;i<n;i++){for(let j=i+1;j<n;j++){groupMatches.push(createMatch(p[i],p[j],k++));}}}allMatches=allMatches.concat(groupMatches.filter(m=>m!==null));});return allMatches;}
function renderGroupMatchesAndStandings(){const selectedCategory=document.getElementById('games-category-select').value;const gamesArea=document.getElementById('games-display-area');const standingsArea=document.getElementById('games-standings-area');const generateSumBtn=document.getElementById('generate-scoresheets-btn');const finalizeBtn=document.getElementById('finalize-groups-btn');gamesArea.innerHTML='';standingsArea.innerHTML='';if(!selectedCategory||!tournamentData[selectedCategory]){standingsArea.innerHTML='<div class="alert alert-warning">Selecione uma categoria para ver os jogos e a classificação.</div>';generateSumBtn.style.display='none';finalizeBtn.style.display='none';return;}calculateGroupStandings(selectedCategory);renderGroupStandings(selectedCategory,standingsArea);renderGroupMatches(selectedCategory,gamesArea);generateSumBtn.style.display='inline-block';finalizeBtn.style.display='inline-block';}
function saveMatchResult(category,matchId){const match=tournamentData[category].matches.find(m=>m.id===matchId);if(!match)return;const result=validateAndProcessSets(match.id);if(!result.valid){alert(`Erro: ${result.error}`);return;}let pts1=0,pts2=0;if(result.finalScore1===3){if(result.finalScore2===0){pts1=5;pts2=0;}else if(result.finalScore2===1){pts1=4;pts2=1;}else if(result.finalScore2===2){pts1=3;pts2=2;}}else if(result.finalScore2===3){if(result.finalScore1===0){pts1=0;pts2=5;}else if(result.finalScore1===1){pts1=1;pts2=4;}else if(result.finalScore1===2){pts1=2;pts2=3;}}match.sets=result.sets;match.finalScore1=result.finalScore1;match.finalScore2=result.finalScore2;match.pointsPro1=result.pointsPro1;match.pointsPro2=result.pointsPro2;match.points1=pts1;match.points2=pts2;match.wo=result.wo;match.done=true;const card=document.getElementById(`game_card_${match.id}`);card.classList.add('done');card.querySelector('.btn-success').disabled=true;card.querySelector('.btn-success').textContent='Salvo ✓'; for(let i=1;i<=5;i++){document.getElementById(`score_${match.id}_p1_s${i}`).disabled=true;document.getElementById(`score_${match.id}_p2_s${i}`).disabled=true;}document.getElementById(`wo_${match.id}_p1`).disabled=true;document.getElementById(`wo_${match.id}_p2`).disabled=true;calculateGroupStandings(category);renderGroupStandings(category,document.getElementById('games-standings-area'));}
function validateAndProcessSets(matchId){const wo1=document.getElementById(`wo_${matchId}_p1`).checked;const wo2=document.getElementById(`wo_${matchId}_p2`).checked;let sets=[],finalScore1=0,finalScore2=0,pointsPro1=0,pointsPro2=0;if(wo1&&wo2)return{valid:false,error:"Ambos os jogadores não podem ser W.O."};if(wo1)return{valid:true,sets:[{s1:0,s2:11},{s1:0,s2:11},{s1:0,s2:11}],finalScore1:0,finalScore2:3,pointsPro1:0,pointsPro2:33,wo:true};if(wo2)return{valid:true,sets:[{s1:11,s2:0},{s1:11,s2:0},{s1:11,s2:0}],finalScore1:3,finalScore2:0,pointsPro1:33,pointsPro2:0,wo:true};for(let i=1;i<=5;i++){const s1_input=document.getElementById(`score_${matchId}_p1_s${i}`);const s2_input=document.getElementById(`score_${matchId}_p2_s${i}`);if(!s1_input||!s2_input)break;const s1_val=s1_input.value;const s2_val=s2_input.value;if(s1_val===''&&s2_val===''){if(finalScore1<3&&finalScore2<3)return{valid:false,error:`Set ${i} incompleto. Jogo deve ter um vencedor (3 sets).`};break;}if(s1_val===''||s2_val==='')return{valid:false,error:`Placar do Set ${i} está incompleto.`};const s1=parseInt(s1_val);const s2=parseInt(s2_val);if(isNaN(s1)||isNaN(s2)||s1<0||s2<0)return{valid:false,error:`Placar do Set ${i} contém valores inválidos.`};const isP1Win=s1>s2;const winnerScore=isP1Win?s1:s2;const loserScore=isP1Win?s2:s1;if(winnerScore<11)return{valid:false,error:`Set ${i} inválido (${s1}x${s2}). Vencedor deve ter no mínimo 11 pontos.`};if(winnerScore===11&&loserScore>9)return{valid:false,error:`Set ${i} inválido (${s1}x${s2}). Se 11, placar do perdedor não pode ser 10.`};if(winnerScore>11&&(winnerScore-loserScore)!==2)return{valid:false,error:`Set ${i} inválido (${s1}x${s2}). Acima de 10, a diferença deve ser de 2 pontos.`};sets.push({s1:s1,s2:s2});pointsPro1+=s1;pointsPro2+=s2;(s1>s2)?finalScore1++:finalScore2++;if(finalScore1===3||finalScore2===3){if(i<5){const next_s1_input=document.getElementById(`score_${matchId}_p1_s${i+1}`);const next_s2_input=document.getElementById(`score_${matchId}_p2_s${i+1}`);if(next_s1_input&&next_s2_input){const next_s1=next_s1_input.value;const next_s2=next_s2_input.value;if(next_s1!==''||next_s2!=='')return{valid:false,error:`O jogo terminou ${finalScore1}x${finalScore2} no Set ${i}, mas o Set ${i+1} está preenchido.`};}}break;}}if(finalScore1<3&&finalScore2<3)return{valid:false,error:"Resultado final inválido. Ninguém venceu 3 sets."};return{valid:true,sets,finalScore1,finalScore2,pointsPro1,pointsPro2,wo:false};}
function calculateGroupStandings(category){const data=tournamentData[category];if(!data||!data.matches)return;const standings={};data.groups.flat().forEach(player=>{standings[player.id]={id:player.id,name:player.name,group:null,Pts:0,J:0,V:0,D:0,SP:0,SC:0,PP:0,PC:0,ID:0};});const completedMatches=data.matches.filter(m=>m.done);completedMatches.forEach(match=>{if(!standings[match.p1.id]||!standings[match.p2.id])return;const p1_stats=standings[match.p1.id];const p2_stats=standings[match.p2.id];p1_stats.group=match.group;p2_stats.group=match.group;p1_stats.J++;p2_stats.J++;p1_stats.Pts+=match.points1;p2_stats.Pts+=match.points2;p1_stats.SP+=match.finalScore1;p1_stats.SC+=match.finalScore2;p2_stats.SP+=match.finalScore2;p2_stats.SC+=match.finalScore1;p1_stats.PP+=match.pointsPro1;p1_stats.PC+=match.pointsPro2;p2_stats.PP+=match.pointsPro2;p2_stats.PC+=match.pointsPro1;(match.finalScore1>match.finalScore2)?(p1_stats.V++,p2_stats.D++):(p1_stats.D++,p2_stats.V++);});const groupedStandings={};Object.values(standings).forEach(playerStats=>{if(playerStats.group===null)return;if(!groupedStandings[playerStats.group])groupedStandings[playerStats.group]=[];groupedStandings[playerStats.group].push(playerStats);});for(const groupName in groupedStandings){groupedStandings[groupName].sort((a,b)=>{if(a.Pts>b.Pts)return-1;if(a.Pts<b.Pts)return 1;const tiedPlayers=groupedStandings[groupName].filter(p=>p.Pts===a.Pts);const tiedPlayerIds=tiedPlayers.map(p=>p.id);const tiedMatches=completedMatches.filter(m=>m.group===groupName&&tiedPlayerIds.includes(m.p1.id)&&tiedPlayerIds.includes(m.p2.id));if(tiedPlayers.length===2){const directMatch=tiedMatches.find(m=>(m.p1.id===a.id&&m.p2.id===b.id)||(m.p1.id===b.id&&m.p2.id===a.id));if(directMatch){if(directMatch.p1.id===a.id&&directMatch.finalScore1>directMatch.finalScore2)return-1;if(directMatch.p2.id===a.id&&directMatch.finalScore2>directMatch.finalScore1)return-1;return 1;}}else if(tiedPlayers.length>2){const miniLeague={};tiedPlayerIds.forEach(id=>{miniLeague[id]={V:0,J:0};});tiedMatches.forEach(m=>{miniLeague[m.p1.id].J++;miniLeague[m.p2.id].J++;(m.finalScore1>m.finalScore2)?miniLeague[m.p1.id].V++:miniLeague[m.p2.id].V++;});const id_a=(miniLeague[a.id].J===0)?0:(miniLeague[a.id].V/miniLeague[a.id].J);const id_b=(miniLeague[b.id].J===0)?0:(miniLeague[b.id].V/miniLeague[b.id].J);a.ID=id_a.toFixed(2);b.ID=id_b.toFixed(2);if(id_a>id_b)return-1;if(id_a<id_b)return 1;}const saldoSetsA=a.SP-a.SC;const saldoSetsB=b.SP-b.SC;if(saldoSetsA>saldoSetsB)return-1;if(saldoSetsA<saldoSetsB)return 1;const saldoPontosA=a.PP-a.PC;const saldoPontosB=b.PP-b.PC;if(saldoPontosA>saldoPontosB)return-1;if(saldoPontosA<saldoPontosB)return 1;if(a.PP>b.PP)return-1;if(a.PP<b.PP)return 1;const p1_rank=athletes.find(p=>p.id===a.id)?.ranking||999;const p2_rank=athletes.find(p=>p.id===b.id)?.ranking||999;return p1_rank-p2_rank;});}data.standings=groupedStandings;}
function renderGroupStandings(category,standingsArea){standingsArea.innerHTML='';const data=tournamentData[category];if(!data||!data.groups)return;if(!data.standings||Object.keys(data.standings).length===0){data.groups.forEach((group,index)=>{const groupName=(data.groups.length>1)?String.fromCharCode(65+index):"Único";standingsArea.innerHTML+=createEmptyStandingsTable(groupName,group);});return;}const sortedGroupNames=Object.keys(data.standings).sort();sortedGroupNames.forEach(groupName=>{const table=document.createElement('table');table.className='standings-table';let tableHtml=`<thead><tr><th colspan="11">Classificação - Grupo ${groupName}</th></tr><tr><th>Pos</th><th>Nome</th><th>Pts</th><th>J</th><th>V</th><th>D</th><th>SP</th><th>SC</th><th>PP</th><th>PC</th><th>ID</th></tr></thead><tbody>`;data.standings[groupName].forEach((stats,index)=>{const qualifiedClass=(index<2&&data.elimination!=="Nenhum (Round Robin)")?'class="qualified"':'';tableHtml+=`<tr ${qualifiedClass}><td>${index+1}</td><td style="text-align:left;">${stats.name}</td><td>${stats.Pts}</td><td>${stats.J}</td><td>${stats.V}</td><td>${stats.D}</td><td>${stats.SP}</td><td>${stats.SC}</td><td>${stats.PP}</td><td>${stats.PC}</td><td>${stats.ID||'N/A'}</td></tr>`;});tableHtml+=`</tbody>`;table.innerHTML=tableHtml;standingsArea.appendChild(table);});}
function createEmptyStandingsTable(groupName,groupPlayers){let tableHtml=`<table class="standings-table"><thead><tr><th colspan="11">Classificação - Grupo ${groupName}</th></tr><tr><th>Pos</th><th>Nome</th><th>Pts</th><th>J</th><th>V</th><th>D</th><th>SP</th><th>SC</th><th>PP</th><th>PC</th><th>ID</th></tr></thead><tbody>`;groupPlayers.forEach((player,index)=>{tableHtml+=`<tr><td>-</td><td style="text-align:left;">${player.name}</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>N/A</td></tr>`;});tableHtml+=`</tbody></table>`;return tableHtml;}
function renderGroupMatches(category,gamesArea){gamesArea.innerHTML='';if(!category||!tournamentData[category]||!tournamentData[category].matches)return;const matches=tournamentData[category].matches;matches.forEach((match,index)=>{const matchCard=document.createElement('div');matchCard.className='game-card';matchCard.id=`game_card_${match.id}`;const isDone=match.done;if(isDone)matchCard.classList.add('done');const wo1=match.wo&&match.finalScore2===3;const wo2=match.wo&&match.finalScore1===3;let setsHtml='';for(let i=1;i<=5;i++){const set=match.sets[i-1];const s1=set?set.s1:'';const s2=set?set.s2:'';setsHtml+=`<div class="set-box"><label>Set ${i}</label><input type="number" class="set-input" id="score_${match.id}_p1_s${i}" value="${s1}" ${isDone?'disabled':''} min="0"><input type="number" class="set-input" id="score_${match.id}_p2_s${i}" value="${s2}" ${isDone?'disabled':''} min="0"></div>`;}matchCard.innerHTML=`<h4>Jogo ${match.matchNumber} (Grupo ${match.group})</h4><div class="player-row"><span class="player-name">${match.p1.name}</span><label class="wo-label"><input type="checkbox" id="wo_${match.id}_p1" onchange="toggleWO('${match.id}','p1',5)" ${wo1?'checked':''} ${isDone?'disabled':''}> W.O.</label></div><div class="player-row"><span class="player-name">${match.p2.name}</span><label class="wo-label"><input type="checkbox" id="wo_${match.id}_p2" onchange="toggleWO('${match.id}','p2',5)" ${wo2?'checked':''} ${isDone?'disabled':''}> W.O.</label></div><div class="set-scores">${setsHtml}</div><div class="game-card-actions"><button class="btn btn-success" style="padding:8px 15px;" onclick="saveMatchResult('${category}','${match.id}')" ${isDone?'disabled':''}>${isDone?'Salvo ✓':'Salvar'}</button></div>`;gamesArea.appendChild(matchCard);});}
function toggleWO(matchId,player,numSets){const wo1_cb=document.getElementById(`wo_${matchId}_p1`);const wo2_cb=document.getElementById(`wo_${matchId}_p2`);const p1_sets=[];const p2_sets=[];for(let i=1;i<=numSets;i++){p1_sets.push(document.getElementById(`score_${matchId}_p1_s${i}`));p2_sets.push(document.getElementById(`score_${matchId}_p2_s${i}`));}const fillSets=(val1,val2)=>{p1_sets.forEach((input,i)=>{if(input){if(i<3)input.value=val1;else input.value='';input.disabled=(val1!==null);}});p2_sets.forEach((input,i)=>{if(input){if(i<3)input.value=val2;else input.value='';input.disabled=(val2!==null);}});};if(player==='p1'&&wo1_cb.checked){wo2_cb.checked=false;fillSets(0,11);}else if(player==='p2'&&wo2_cb.checked){wo1_cb.checked=false;fillSets(11,0);}else{fillSets(null,null);}}

// -----------------------------------------------------------------
// PASSO 7: FUNÇÕES DA PÁGINA "ELIMINATÓRIAS"
// -----------------------------------------------------------------
function populateKnockoutCategorySelector(){const select=document.getElementById('knockout-category-select');const currentSelection=select.value;select.innerHTML='';const categoriesWithKO=Object.keys(tournamentData).filter(key=>tournamentData[key].knockoutRounds&&Object.keys(tournamentData[key].knockoutRounds).length>0);if(categoriesWithKO.length===0){select.innerHTML='<option value="">-- Nenhuma eliminatória gerada --</option>';return;}select.innerHTML='<option value="">-- Selecione a categoria --</option>';categoriesWithKO.forEach(category=>{const categoryName=getCategoryDisplayName(category);const isSelected=category===currentSelection?'selected':'';select.innerHTML+=`<option value="${category}" ${isSelected}>${categoryName}</option>`;});}
function finalizeGroupsAndGenerateKnockout(){const category=document.getElementById('games-category-select').value;if(!category){alert("Selecione uma categoria primeiro.");return;}const data=tournamentData[category];if(!data.matches){alert("Erro: Jogos de grupo não foram gerados para esta categoria.");return;}const allMatchesDone=data.matches.every(m=>m.done);if(!allMatchesDone){alert("Erro: Nem todos os jogos do grupo foram salvos. Conclua todos os jogos antes de gerar as eliminatórias.");return;}if(data.elimination==="Nenhum (Round Robin)"){alert("Categoria de Grupo Único finalizada! Verifique o Ranking.");generateRanking(category);populateRankingCategorySelector();document.getElementById('ranking-category-select').value=category;renderRanking();showPage('ranking');return;}const qualifiedPlayers={};calculateGroupStandings(category);const standings=data.standings;if(!standings||Object.keys(standings).length===0){alert("Erro ao calcular classificação final dos grupos.");return;}for(const groupName in data.standings){qualifiedPlayers[`1${groupName}`]=data.standings[groupName][0];if(data.standings[groupName][1])qualifiedPlayers[`2${groupName}`]=data.standings[groupName][1];else qualifiedPlayers[`2${groupName}`]=null;}const pairingRules=knockoutPairings[data.knockoutKey];const roundName=data.elimination;data.knockoutRounds={};data.knockoutRounds[roundName]=[];let matchCount=1;pairingRules.forEach(rule=>{const p1=qualifiedPlayers[rule.p1_source];const p2=qualifiedPlayers[rule.p2_source];const match={id:`ko_${category}_${roundName.replace(/\s+/g,'')}_${matchCount++}`,type:'knockout',round:roundName,matchNumber:matchCount-1,p1:p1?athletes.find(a=>a.id===p1.id):{id:0,name:`Classif. ${rule.p1_source}`},p2:p2?athletes.find(a=>a.id===p2.id):{id:0,name:`Classif. ${rule.p2_source}`},sets:[],finalScore1:null,finalScore2:null,pointsPro1:0,pointsPro2:0,points1:0,points2:0,wo:false,done:false,winner:null,loser:null};data.knockoutRounds[roundName].push(match);});alert(`Eliminatórias (${roundName}) geradas com sucesso para ${getCategoryDisplayName(category)}!`);populateKnockoutCategorySelector();document.getElementById('knockout-category-select').value=category;renderKnockoutBracket();showPage('eliminatorias');}
function renderKnockoutBracket(){const category=document.getElementById('knockout-category-select').value;const displayArea=document.getElementById('knockout-display-area');const infoArea=document.getElementById('knockout-info-area');displayArea.innerHTML='';infoArea.innerHTML='';if(!category||!tournamentData[category]||!tournamentData[category].knockoutRounds||Object.keys(tournamentData[category].knockoutRounds).length===0){infoArea.innerHTML='<div class="alert alert-warning">Nenhuma eliminatória gerada ou selecionada. Finalize os grupos primeiro.</div>';return;}const rounds=tournamentData[category].knockoutRounds;const roundOrder=["Oitavas de Final","Quartas de Final","Semifinal","Final"];for(const roundName of roundOrder){if(rounds[roundName]){const roundDiv=document.createElement('div');roundDiv.className='round';roundDiv.innerHTML=`<div class="round-header"><h3 class="round-title">${roundName}</h3><button class="btn btn-info btn-pdf" onclick="generateBatchScoresheets('${category}', 'knockout', '${roundName}')">📄 Gerar Súmulas ${roundName}</button></div>`;rounds[roundName].forEach(match=>{const matchCard=createKnockoutMatchCard(category,match);roundDiv.appendChild(matchCard);});displayArea.appendChild(roundDiv);}}}
function createKnockoutMatchCard(category,match){const matchCard=document.createElement('div');matchCard.className='game-card knockout-match';matchCard.id=`game_card_${match.id}`;const isDone=match.done;if(isDone)matchCard.classList.add('done');const p1_id=match.p1?match.p1.id:0;const p2_id=match.p2?match.p2.id:0;const p1_name=match.p1?match.p1.name:'A definir';const p2_name=match.p2?match.p2.name:'A definir';const p1_class=(isDone&&match.winner&&match.winner.id===p1_id)?'winner':(p1_id===0?'tbd':'');const p2_class=(isDone&&match.winner&&match.winner.id===p2_id)?'winner':(p2_id===0?'tbd':'');const canSave=p1_id!==0&&p2_id!==0;const wo1=match.wo&&match.finalScore2===3;const wo2=match.wo&&match.finalScore1===3;let setsHtml='';for(let i=1;i<=5;i++){const set=match.sets[i-1];const s1=set?set.s1:'';const s2=set?set.s2:'';setsHtml+=`<div class="set-box"><label>Set ${i}</label><input type="number" class="set-input" id="score_${match.id}_p1_s${i}" value="${s1}" ${isDone||!canSave?'disabled':''} min="0"><input type="number" class="set-input" id="score_${match.id}_p2_s${i}" value="${s2}" ${isDone||!canSave?'disabled':''} min="0"></div>`;}matchCard.innerHTML=`<h4>${match.round} - Jogo #${match.matchNumber||match.id.split('_').pop()}</h4><div class="player-row"><span class="player-name ${p1_class}">${p1_name}</span><label class="wo-label"><input type="checkbox" id="wo_${match.id}_p1" onchange="toggleWO('${match.id}','p1',5)" ${wo1?'checked':''} ${isDone||!canSave?'disabled':''}> W.O.</label></div><div class="player-row"><span class="player-name ${p2_class}">${p2_name}</span><label class="wo-label"><input type="checkbox" id="wo_${match.id}_p2" onchange="toggleWO('${match.id}','p2',5)" ${wo2?'checked':''} ${isDone||!canSave?'disabled':''}> W.O.</label></div><div class="set-scores">${setsHtml}</div><div class="game-card-actions"><button class="btn btn-success" style="padding:8px 15px;" onclick="saveKnockoutMatch('${category}','${match.id}')" ${isDone||!canSave?'disabled':''}>${isDone?'Salvo ✓':'Salvar'}</button></div>`;return matchCard;} // Botão súmula individual removido
function saveKnockoutMatch(category,matchId){const data=tournamentData[category];let match=null,currentRoundName=null;for(const roundName in data.knockoutRounds){match=data.knockoutRounds[roundName].find(m=>m.id===matchId);if(match){currentRoundName=roundName;break;}}if(!match)return;const result=validateAndProcessSets(match.id);if(!result.valid){alert(`Erro: ${result.error}`);return;}let pts1=0,pts2=0;if(result.finalScore1===3){if(result.finalScore2===0){pts1=5;pts2=0;}else if(result.finalScore2===1){pts1=4;pts2=1;}else if(result.finalScore2===2){pts1=3;pts2=2;}}else if(result.finalScore2===3){if(result.finalScore1===0){pts1=0;pts2=5;}else if(result.finalScore1===1){pts1=1;pts2=4;}else if(result.finalScore1===2){pts1=2;pts2=3;}}match.sets=result.sets;match.finalScore1=result.finalScore1;match.finalScore2=result.finalScore2;match.pointsPro1=result.pointsPro1;match.pointsPro2=result.pointsPro2;match.points1=pts1;match.points2=pts2;match.wo=result.wo;match.done=true;match.winner=(match.finalScore1>match.finalScore2)?match.p1:match.p2;match.loser=(match.finalScore1>match.finalScore2)?match.p2:match.p1;advanceWinner(category,match.winner,currentRoundName,match.id);renderKnockoutBracket();if(currentRoundName==="Final"){alert(`Torneio ${getCategoryDisplayName(category)} finalizado! Campeão: ${match.winner.name}`);generateRanking(category);populateRankingCategorySelector();document.getElementById('ranking-category-select').value=category;renderRanking();showPage('ranking');}}
function advanceWinner(category,winner,currentRoundName,sourceMatchId){const data=tournamentData[category];const roundOrder=["Oitavas de Final","Quartas de Final","Semifinal","Final"];const currentRoundIndex=roundOrder.indexOf(currentRoundName);if(currentRoundIndex===-1||currentRoundIndex===roundOrder.length-1)return;const nextRoundName=roundOrder[currentRoundIndex+1];if(!data.knockoutRounds[nextRoundName])data.knockoutRounds[nextRoundName]=[];const currentRoundMatches=data.knockoutRounds[currentRoundName];const matchIndex=currentRoundMatches.findIndex(m=>m.id===sourceMatchId);const nextMatchIndex=Math.floor(matchIndex/2);const positionInNextMatch=(matchIndex%2===0)?'p1':'p2';if(!data.knockoutRounds[nextRoundName][nextMatchIndex]){const nextMatchCount=data.knockoutRounds[nextRoundName].filter(Boolean).length+1;const prevMatch1Index=nextMatchIndex*2;const prevMatch2Index=nextMatchIndex*2+1;const prevMatch1=currentRoundMatches[prevMatch1Index];const prevMatch2=currentRoundMatches[prevMatch2Index];const p1Placeholder=`Vencedor (${currentRoundName} J${prevMatch1?prevMatch1.matchNumber||prevMatch1.id.split('_').pop():'?'})`;const p2Placeholder=`Vencedor (${currentRoundName} J${prevMatch2?prevMatch2.matchNumber||prevMatch2.id.split('_').pop():'?'})`;data.knockoutRounds[nextRoundName][nextMatchIndex]={id:`ko_${category}_${nextRoundName.replace(/\s+/g,'')}_${nextMatchCount}`,type:'knockout',round:nextRoundName,matchNumber:nextMatchCount,p1:{id:0,name:p1Placeholder},p2:{id:0,name:p2Placeholder},sets:[],finalScore1:null,finalScore2:null,pointsPro1:0,pointsPro2:0,points1:0,points2:0,wo:false,done:false,winner:null,loser:null};}data.knockoutRounds[nextRoundName][nextMatchIndex][positionInNextMatch]=winner;}

// -----------------------------------------------------------------
// PASSO 8: FUNÇÕES DA PÁGINA "RANKING" (Com pontuação acumulada)
// -----------------------------------------------------------------
function populateRankingCategorySelector(){const select=document.getElementById('ranking-category-select');const currentSelection=select.value;select.innerHTML='';const categoriesRanked=Object.keys(tournamentData).filter(key=>tournamentData[key].ranking);const saveBtn=document.getElementById('save-ranking-pdf-btn');if(categoriesRanked.length===0){select.innerHTML='<option value="">-- Nenhum torneio finalizado --</option>';saveBtn.style.display='none';return;}select.innerHTML='<option value="">-- Selecione a categoria --</option>';categoriesRanked.forEach(category=>{const categoryName=getCategoryDisplayName(category);const isSelected=category===currentSelection?'selected':'';select.innerHTML+=`<option value="${category}" ${isSelected}>${categoryName}</option>`;});if(currentSelection&&tournamentData[currentSelection]&&tournamentData[currentSelection].ranking){saveBtn.style.display='inline-block';}else{saveBtn.style.display='none';}}
function calculateTotalBonusPoints(athleteId,category){const data=tournamentData[category];let totalBonus=0;if(data.matches){data.matches.forEach(match=>{if(match.p1.id===athleteId)totalBonus+=match.points1;if(match.p2.id===athleteId)totalBonus+=match.points2;});}for(const roundName in data.knockoutRounds){data.knockoutRounds[roundName].forEach(match=>{if(!match.done||match.p1.id===0||match.p2.id===0)return;if(match.p1.id===athleteId)totalBonus+=match.points1;if(match.p2.id===athleteId)totalBonus+=match.points2;});}return totalBonus;}
function generateRanking(category){const data=tournamentData[category];if(!data)return;const finalRanking=[];const n=data.numAthletes;let pointsTable;if(n<=12)pointsTable=rankingPointsConfig['12'];else if(n<=16)pointsTable=rankingPointsConfig['16'];else pointsTable=rankingPointsConfig['24'];const finalMatch=data.knockoutRounds["Final"]?data.knockoutRounds["Final"][0]:null;if(finalMatch&&finalMatch.done){finalRanking.push({pos:1,id:finalMatch.winner.id,name:finalMatch.winner.name,stage:"Campeão"});finalRanking.push({pos:2,id:finalMatch.loser.id,name:finalMatch.loser.name,stage:"Vice-Campeão"});}if(data.knockoutRounds["Semifinal"]){data.knockoutRounds["Semifinal"].forEach(match=>{if(match.done&&match.loser&&match.loser.id!==0)finalRanking.push({pos:3,id:match.loser.id,name:match.loser.name,stage:"Semifinal"});});}if(data.knockoutRounds["Quartas de Final"]){data.knockoutRounds["Quartas de Final"].forEach(match=>{if(match.done&&match.loser&&match.loser.id!==0)finalRanking.push({pos:5,id:match.loser.id,name:match.loser.name,stage:"Quartas"});});}if(data.knockoutRounds["Oitavas de Final"]){data.knockoutRounds["Oitavas de Final"].forEach(match=>{if(match.done&&match.loser&&match.loser.id!==0)finalRanking.push({pos:9,id:match.loser.id,name:match.loser.name,stage:"Oitavas"});});}const rankedIds=new Set(finalRanking.map(p=>p.id));if(data.standings){Object.values(data.standings).forEach(group=>{group.forEach((playerStats,idx)=>{if(!rankedIds.has(playerStats.id)){let stage="Fase de Grupos";let calculatedPos=17;if(idx<2&&data.elimination!=="Nenhum (Round Robin)"){stage=data.elimination||"Classificação";if(stage==="Oitavas de Final")calculatedPos=9;else if(stage==="Quartas de Final")calculatedPos=5;else if(stage==="Semifinal")calculatedPos=3;}const pointsKey=pointsTable[stage]?stage:"Classificação";finalRanking.push({pos:calculatedPos,id:playerStats.id,name:playerStats.name,stage:stage});}});});}if(data.elimination==="Nenhum (Round Robin)"){const group=data.standings["Único"];group.forEach((player,index)=>{if(!rankedIds.has(player.id)){let stage="";if(index===0)stage="Campeão";else if(index===1)stage="Vice-Campeão";else stage="Semifinal";finalRanking.push({pos:index+1,id:player.id,name:player.name,stage:stage});}});finalRanking.sort((a,b)=>a.pos-b.pos);}const rankingComPontos=finalRanking.map(player=>{const basePoints=pointsTable[player.stage]||pointsTable["Classificação"]||0;const bonusPoints=calculateTotalBonusPoints(player.id,category);return{...player,basePoints:basePoints,bonusPoints:bonusPoints,totalPoints:basePoints+bonusPoints};}).filter(p=>p.id!==0);rankingComPontos.sort((a,b)=>{if(a.pos!==b.pos){return a.pos-b.pos;}return b.totalPoints-a.totalPoints;});data.ranking=rankingComPontos;}
function renderRanking(){const category=document.getElementById('ranking-category-select').value;const displayArea=document.getElementById('ranking-display-area');const saveBtn=document.getElementById('save-ranking-pdf-btn');displayArea.innerHTML='';if(!category||!tournamentData[category]||!tournamentData[category].ranking){displayArea.innerHTML='<div class="alert alert-warning">Nenhum ranking finalizado para esta categoria.</div>';saveBtn.style.display='none';return;}const ranking=tournamentData[category].ranking;let tableHtml=`<table class="standings-table ranking-table"><thead><tr><th colspan="6">Ranking Final - ${getCategoryDisplayName(category)}</th></tr><tr><th>Pos.</th><th>Atleta</th><th>Fase</th><th>P. Base</th><th>P. Bónus</th><th>P. Total</th></tr></thead><tbody>`;let displayPos=0;let lastPos=0;ranking.forEach((player,index)=>{if(player.pos!==lastPos){lastPos=player.pos;displayPos=index+1;}tableHtml+=`<tr><td>${displayPos}º</td><td style="text-align:left;">${player.name}</td><td>${player.stage}</td><td>${player.basePoints}</td><td>${player.bonusPoints}</td><td><strong>${player.totalPoints}</strong></td></tr>`;});tableHtml+=`</tbody></table>`;displayArea.innerHTML=tableHtml;saveBtn.style.display='inline-block';}

// -----------------------------------------------------------------
// PASSO 9: (ATUALIZADO) FUNÇÕES DA PÁGINA "RELATÓRIOS"
// -----------------------------------------------------------------
function generateAthleteReport(){if(typeof window.jspdf==='undefined'){alert('Erro: A biblioteca jsPDF não carregou.');return;}const{jsPDF}=window.jspdf;if(athletes.length===0){alert('Não há atletas cadastrados para gerar o relatório.');return;}const doc=new jsPDF();doc.text("Relatório de Atletas Cadastrados - CTB",14,15);const tableData=athletes.map(a=>[a.name,getCategoryDisplayName(a.category),a.ranking]);doc.autoTable({head:[['Nome','Categoria','Ranking']],body:tableData,startY:20});doc.save('relatorio_atletas_ctb.pdf');}
function generateResultsReport(){if(typeof window.jspdf==='undefined'){alert('Erro: A biblioteca jsPDF não carregou.');return;}const{jsPDF}=window.jspdf;const doc=new jsPDF();doc.text("Relatório de Classificação - Fase de Grupos",14,15);let yPos=20;const categories=Object.keys(tournamentData);if(categories.length===0){alert("Nenhum grupo foi gerado ainda.");return;}for(const category of categories){const data=tournamentData[category];if(!data.standings||Object.keys(data.standings).length===0)continue;if(yPos>250){doc.addPage();yPos=15;}doc.setFont(undefined,'bold');doc.text(getCategoryDisplayName(category),14,yPos);yPos+=10;const sortedGroupNames=Object.keys(data.standings).sort();for(const groupName of sortedGroupNames){if(yPos>250){doc.addPage();yPos=15;}doc.setFont(undefined,'normal');doc.text(`Grupo ${groupName}`,14,yPos);const tableHead=[['Pos','Nome','Pts','J','V','D','SP','SC','PP','PC','ID']];const tableBody=data.standings[groupName].map((stats,index)=>[index+1,stats.name,stats.Pts,stats.J,stats.V,stats.D,stats.SP,stats.SC,stats.PP,stats.PC,stats.ID||'-']);doc.autoTable({head:tableHead,body:tableBody,startY:yPos+2,theme:'grid',headStyles:{fillColor:[42,82,152]},styles:{fontSize:8,cellPadding:1},columnStyles:{1:{cellWidth:35}}});yPos=doc.lastAutoTable.finalY+10;}}doc.save('relatorio_classificacao_grupos_ctb.pdf');}
function generateGroupsReport(specificCategory=null){if(typeof window.jspdf==='undefined'){alert('Erro: A biblioteca jsPDF não carregou.');return;}const{jsPDF}=window.jspdf;const doc=new jsPDF();doc.text("Relatório de Formação de Grupos",14,15);let yPos=20;const categories=specificCategory?[specificCategory]:Object.keys(tournamentData).filter(c=>tournamentData[c]&&tournamentData[c].groups);if(categories.length===0||!tournamentData[categories[0]]||!tournamentData[categories[0]].groups){alert("Nenhum grupo foi gerado ainda"+(specificCategory?` para ${getCategoryDisplayName(specificCategory)}.`:" para nenhuma categoria."));return;}for(const category of categories){const data=tournamentData[category];if(!data||!data.groups)continue;if(yPos>260&&(categories.length>1||specificCategory)){doc.addPage();yPos=15;}doc.setFont(undefined,'bold');doc.text(getCategoryDisplayName(category),14,yPos);yPos+=8;data.groups.forEach((group,index)=>{const groupName=(data.groups.length>1)?String.fromCharCode(65+index):"Único";doc.setFont(undefined,'normal');const tableHead=[[`Grupo ${groupName}`,'Ranking']];const tableBody=group.map(player=>[player.name,player.ranking]);if(yPos+tableBody.length*5 > 280){doc.addPage();yPos=15;}doc.autoTable({head:tableHead,body:tableBody,startY:yPos,theme:'striped',headStyles:{fillColor:[42,82,152]}});yPos=doc.lastAutoTable.finalY+8;});yPos+=5;}const filename=specificCategory?`relatorio_grupos_${specificCategory}.pdf`:'relatorio_grupos_geral_ctb.pdf';doc.save(filename.replace(/[^a-z0-9_.-]/gi,'_'));}
function generateGroupMatchesReport(specificCategory=null){if(typeof window.jspdf==='undefined'){alert('Erro: A biblioteca jsPDF não carregou.');return;}const{jsPDF}=window.jspdf;const doc=new jsPDF();doc.text("Relatório de Jogos - Fase de Grupos",14,15);let yPos=20;const categories=specificCategory?[specificCategory]:Object.keys(tournamentData).filter(c=>tournamentData[c]&&tournamentData[c].matches);if(categories.length===0||!tournamentData[categories[0]]||!tournamentData[categories[0]].matches){alert("Nenhum jogo de grupo foi gerado ainda"+(specificCategory?` para ${getCategoryDisplayName(specificCategory)}.`:" para nenhuma categoria."));return;}for(const category of categories){const data=tournamentData[category];if(!data||!data.matches)continue;if(yPos>260&&(categories.length>1||specificCategory)){doc.addPage();yPos=15;}doc.setFont(undefined,'bold');doc.text(getCategoryDisplayName(category),14,yPos);yPos+=10;const tableHead=[['Grupo','Jogo #','Jogador 1','Jogador 2','Resultado Sets','Placar Final']];const tableBody=data.matches.map((match,index)=>{const setResult=match.sets.map(set=>`${set.s1}x${set.s2}`).join(' / ');const finalResult=match.done?`${match.finalScore1} x ${match.finalScore2}`:'A Jogar';return[match.group,match.matchNumber||index+1,match.p1.name,match.p2.name,setResult,finalResult];});if(yPos+tableBody.length*6>280&&(categories.length>1||specificCategory)){doc.addPage();yPos=15;doc.setFont(undefined,'bold');doc.text(getCategoryDisplayName(category)+" (cont.)",14,yPos);yPos+=10;}doc.autoTable({head:tableHead,body:tableBody,startY:yPos,theme:'grid',headStyles:{fillColor:[42,82,152]},styles:{fontSize:8},columnStyles:{0:{cellWidth:15},1:{cellWidth:15},2:{cellWidth:40},3:{cellWidth:40},4:{cellWidth:40},5:{cellWidth:20}}});yPos=doc.lastAutoTable.finalY+10;}const filename=specificCategory?`relatorio_jogos_grupo_${specificCategory}.pdf`:'relatorio_jogos_grupo_geral_ctb.pdf';doc.save(filename.replace(/[^a-z0-9_.-]/gi,'_'));}
function generateGroupMatchesReportCurrentCategory(){const category=document.getElementById('games-category-select').value;if(category){generateGroupMatchesReport(category);}else{alert("Por favor, selecione uma categoria primeiro.");}}
function generateKnockoutReport(specificCategory=null,specificRound=null){if(typeof window.jspdf==='undefined'){alert('Erro: A biblioteca jsPDF não carregou.');return;}const{jsPDF}=window.jspdf;const doc=new jsPDF();const title=specificRound?`Relatório de Jogos - ${getCategoryDisplayName(specificCategory)} - ${specificRound}`:"Relatório de Jogos - Fase Eliminatória";doc.text(title,14,15);let yPos=20;const categories=specificCategory?[specificCategory]:Object.keys(tournamentData).filter(c=>tournamentData[c]&&tournamentData[c].knockoutRounds&&Object.keys(tournamentData[c].knockoutRounds).length>0);if(categories.length===0||!categories.some(cat => tournamentData[cat] && tournamentData[cat].knockoutRounds && Object.keys(tournamentData[cat].knockoutRounds).length > 0)){alert("Nenhuma eliminatória foi gerada ainda"+(specificCategory?` para ${getCategoryDisplayName(specificCategory)}.`:"."));return;}for(const category of categories){const data=tournamentData[category];if(!data||!data.knockoutRounds||Object.keys(data.knockoutRounds).length===0)continue;if(yPos>260&&(categories.length>1||specificCategory)){doc.addPage();yPos=15;}if(!specificRound){doc.setFont(undefined,'bold');doc.text(getCategoryDisplayName(category),14,yPos);yPos+=10;}const roundOrder=specificRound?[specificRound]:["Oitavas de Final","Quartas de Final","Semifinal","Final"];for(const roundName of roundOrder){if(data.knockoutRounds[roundName]){if(yPos>260){doc.addPage();yPos=15;}doc.setFont(undefined,'normal');doc.text(roundName,14,yPos);yPos+=2;const tableHead=[['Jogo #','Jogador 1','Jogador 2','Resultado Sets','Placar Final']];const tableBody=data.knockoutRounds[roundName].map((match,idx)=>{const setResult=match.sets.map(set=>`${set.s1}x${set.s2}`).join(' / ');const finalResult=match.done?`${match.finalScore1} x ${match.finalScore2}`:(match.p1.id===0||match.p2.id===0?'A definir':'A Jogar');return[match.matchNumber||idx+1,match.p1.name,match.p2.name,setResult,finalResult];});doc.autoTable({head:tableHead,body:tableBody,startY:yPos,theme:'grid',headStyles:{fillColor:[42,82,152]},styles:{fontSize:8},columnStyles:{0:{cellWidth:15},1:{cellWidth:40},2:{cellWidth:40},3:{cellWidth:45},4:{cellWidth:20}}});yPos=doc.lastAutoTable.finalY+10;}else if(specificRound){/*Não faz nada se a rodada específica não existir*/}}}const filenameBase=specificCategory?`relatorio_${specificCategory}`:'relatorio_eliminatorias_geral_ctb';const roundSuffix=specificRound?`_${roundName.replace(/\s+/g,'')}`:'';doc.save(`${filenameBase}${roundSuffix}.pdf`.replace(/[^a-z0-9_.-]/gi,'_'));}
function generateKnockoutRoundReport(category, roundName){ generateKnockoutReport(category, roundName); }

/**
 * NOVO: Gera súmulas em lote (3 por página A4) em BRANCO
 */
 function generateBatchScoresheets(category, matchType = 'group', roundName = null) {
    if (!category) { alert("Por favor, selecione uma categoria."); return; }
    const data = tournamentData[category];
    if (!data) { alert("Dados não encontrados para esta categoria."); return; }

    let matches = [];
    let phaseTitle = "";
    let fileNameSuffix = "";

    if (matchType === 'group') {
        if (!data.matches || data.matches.length === 0) { alert("Nenhum jogo de grupo gerado para esta categoria."); return; }
        matches = data.matches;
        phaseTitle = `Fase de Grupos`;
        fileNameSuffix = `Grupo_${category}`;
    } else if (matchType === 'knockout') {
        if (!roundName || !data.knockoutRounds || !data.knockoutRounds[roundName] || data.knockoutRounds[roundName].length === 0) {
            alert(`Nenhum jogo gerado para ${roundName} nesta categoria.`); return;
        }
        matches = data.knockoutRounds[roundName];
        phaseTitle = roundName;
        fileNameSuffix = `${category}_${roundName.replace(/\s+/g, '')}`;
    } else {
        alert("Tipo de partida inválido para gerar súmulas em lote."); return;
    }

    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') { alert('Erro: A biblioteca jsPDF não carregou.'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.getHeight(); const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10; const scoresheetHeight = (pageHeight - (margin * 2)) / 3; let currentY = margin;

    doc.setFontSize(9);

    matches.forEach((match, index) => {
        const sheetIndex = index % 3;
        currentY = margin + (sheetIndex * scoresheetHeight);
        if (index > 0 && sheetIndex === 0) { doc.addPage(); currentY = margin; }

        const startX = margin; const endX = pageWidth - margin;
        const contentWidth = endX - startX; const centerX = startX + contentWidth / 2;
        
        // Cabeçalho
        try {
             if (ctbLogoBase64 && !ctbLogoBase64.startsWith('data:image/png;base64,iVBORw0KGgo')) { 
                doc.addImage(ctbLogoBase64, 'PNG', startX, currentY + 2, 15, 8); 
             } else { throw new Error("Logo inválida"); }
         } catch(e) { console.warn("Logo Base64 inválida ou não definida. Usando texto.", e); doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.text("CTB", startX, currentY + 7); doc.setFont(undefined, 'normal'); doc.setFontSize(9);}
        doc.setFontSize(11); doc.text("TORNEIO CTB - SÚMULA DE JOGO", centerX, currentY + 7, { align: 'center' });

        // Informações
        doc.setFontSize(8);
        const infoY = currentY + 15;
        doc.text(`Categoria: ${getCategoryDisplayName(category)}`, startX, infoY);
        doc.text(`Fase: ${match.group ? 'Grupo ' + match.group : phaseTitle}`, startX + 70, infoY);
        doc.text(`Jogo: ${match.matchNumber !== undefined ? match.matchNumber : (index + 1)}`, startX + 130, infoY);
        doc.setLineWidth(0.3); doc.line(startX, infoY + 2, endX, infoY + 2);

        // Tabela de Pontuação Vazia
        const tableStartY = infoY + 5;
        const colWidths = [contentWidth * 0.35, ...Array(5).fill(contentWidth * 0.08), contentWidth * 0.09, contentWidth * 0.09];
        const rowHeight = 5.5; 
        let currentTableY = tableStartY;

        doc.setFontSize(8); doc.setFont(undefined, 'bold');
        doc.setFillColor(230, 230, 230); doc.rect(startX, currentTableY, contentWidth, rowHeight, 'FD');
        let currentTableX = startX;
        ['Jogador', 'S1', 'S2', 'S3', 'S4', 'S5', 'Sets', 'Pontos'].forEach((header, i) => {
             doc.rect(currentTableX, currentTableY, colWidths[i], rowHeight);
             doc.text(header, currentTableX + colWidths[i] / 2, currentTableY + rowHeight / 1.5, { align: 'center', baseline: 'middle' });
             currentTableX += colWidths[i];
        });
        currentTableY += rowHeight;

        const drawPlayerRow = (playerName) => {
            doc.setFont(undefined, 'normal'); currentTableX = startX;
            doc.rect(currentTableX, currentTableY, colWidths[0], rowHeight);
            doc.text(playerName || 'A definir', currentTableX + 2, currentTableY + rowHeight / 1.5, { baseline: 'middle', maxWidth: colWidths[0] - 4 });
            currentTableX += colWidths[0];
            for(let i=0; i < 7; i++){ doc.rect(currentTableX, currentTableY, colWidths[i+1], rowHeight); currentTableX += colWidths[i+1]; }
            currentTableY += rowHeight;
        };

        drawPlayerRow(match.p1.name);
        drawPlayerRow(match.p2.name);

        doc.setFontSize(9);
        doc.text("Resultado Final: _____ x _____ ", centerX - 20, currentTableY + 8);
        doc.text("Árbitro:", startX, currentTableY + 16);
        doc.setLineWidth(0.2); doc.line(startX + 18, currentTableY + 16, startX + 100, currentTableY + 16);

        if (sheetIndex < 2) { doc.setLineWidth(0.3); doc.line(startX, currentY + scoresheetHeight - 2, endX, currentY + scoresheetHeight - 2); }
    });
    doc.save(`Sumulas_Em_Branco_${fileNameSuffix}.pdf`);
}

/**
 * NOVO: Gera PDF do Ranking Final
 */
function generateRankingReport(category) {
    if (!category) { alert("Por favor, selecione uma categoria."); return; }
    const data = tournamentData[category];
    if (!data || !data.ranking) { alert("Ranking final ainda não calculado para esta categoria."); return; }
    if (typeof window.jspdf === 'undefined') { alert('Erro: A biblioteca jsPDF não carregou.'); return; }
    const { jsPDF } = window.jspdf;
    
    const doc = new jsPDF();
    doc.text(`Ranking Final - ${getCategoryDisplayName(category)}`, 14, 15);
    
    const tableHead = [['Pos.', 'Atleta', 'Fase', 'P. Base', 'P. Bónus', 'P. Total']];
    let displayPos = 0; let lastPos = 0;
    const tableBody = data.ranking.map((player, index) => {
         if (player.pos !== lastPos) { lastPos = player.pos; displayPos = index + 1; }
        return [`${displayPos}º`, player.name, player.stage, player.basePoints, player.bonusPoints, player.totalPoints];
    });

     doc.autoTable({
        head: tableHead, body: tableBody, startY: 20, theme: 'grid',
        headStyles: { fillColor: [42, 82, 152] }, styles: { fontSize: 10 },
        columnStyles: { 0: { halign: 'center', cellWidth: 15}, 1: { halign: 'left', cellWidth: 60 }, 2: { halign: 'center', cellWidth: 30}, 3: { halign: 'center', cellWidth: 20 }, 4: { halign: 'center', cellWidth: 20 }, 5: { halign: 'center', fontStyle: 'bold', cellWidth: 20 } }
    });
    doc.save(`Ranking_Final_${category}.pdf`);
}

/**
 * NOVO: Gera PDF com TODOS os resultados (Grupos e Eliminatórias)
 */
 function generateOverallResultsReport() {
    if (typeof window.jspdf === 'undefined') { alert('Erro: A biblioteca jsPDF não carregou.'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.text("Relatório Geral de Resultados - CTB", 14, 15);
    let yPos = 20;
    const categories = Object.keys(tournamentData).sort(); 
    
    if (categories.length === 0) { alert("Nenhum torneio iniciado ou sem dados."); return; }

    for (const category of categories) {
        const data = tournamentData[category];
        if (!data) continue;
        const categoryName = getCategoryDisplayName(category);
        
        const checkNewPage = (neededHeight) => {
            if (yPos + neededHeight > 280) { doc.addPage(); yPos = 15; doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text(`${categoryName} (continuação)`, 14, yPos); yPos += 10; doc.setFontSize(10);}
        };

        checkNewPage(20); 
        doc.setFontSize(14); doc.setFont(undefined, 'bold');
        doc.text(categoryName, 14, yPos); yPos += 10;
        doc.setFontSize(10); doc.setFont(undefined, 'normal');

        // Jogos de Grupo
        if (data.matches && data.matches.length > 0) {
            checkNewPage(15);
            doc.setFont(undefined, 'bold'); doc.text("Fase de Grupos", 14, yPos); yPos += 2;
            doc.setFont(undefined, 'normal');
            
            const tableHeadGroup = [['Grupo', 'J#', 'Jogador 1', 'Jogador 2', 'Sets', 'Placar', 'Pts Bônus']];
            const tableBodyGroup = data.matches.map((match, index) => {
                const setResult = match.sets.map(set => `${set.s1}x${set.s2}`).join(' ');
                const finalResult = match.done ? `${match.finalScore1}x${match.finalScore2}` : '-';
                const bonusPts = match.done ? `${match.points1} x ${match.points2}` : '-';
                return [match.group, match.matchNumber || index + 1, match.p1.name, match.p2.name, setResult, finalResult, bonusPts];
            });
            
            doc.autoTable({
                head: tableHeadGroup, body: tableBodyGroup, startY: yPos, theme: 'grid',
                headStyles: { fillColor: [200, 200, 200], textColor: 0 }, styles: { fontSize: 7, cellPadding: 1 }, // Fonte menor
                columnStyles: { 0:{cellWidth: 12}, 1:{cellWidth: 8}, 2:{cellWidth: 35}, 3:{cellWidth: 35}, 4:{cellWidth: 40}, 5:{cellWidth: 15}, 6:{cellWidth: 15} } // Ajuste larguras
            });
            yPos = doc.lastAutoTable.finalY + 10;
        }

        // Jogos Eliminatórios
        if (data.knockoutRounds && Object.keys(data.knockoutRounds).length > 0) {
            checkNewPage(15);
             doc.setFont(undefined, 'bold'); doc.text("Fase Eliminatória", 14, yPos); yPos += 8;
             doc.setFont(undefined, 'normal');
            const roundOrder = ["Oitavas de Final", "Quartas de Final", "Semifinal", "Final"];
            for (const roundName of roundOrder) {
                if (data.knockoutRounds[roundName]) {
                     checkNewPage(15);
                     doc.setFont(undefined, 'bolditalic'); doc.text(roundName, 14, yPos); yPos += 2;
                     doc.setFont(undefined, 'normal');
                    const tableHeadKO = [['J#','Jogador 1', 'Jogador 2', 'Sets', 'Placar', 'Pts Bônus']];
                    const tableBodyKO = data.knockoutRounds[roundName].map((match, index) => {
                        const setResult = match.sets.map(set => `${set.s1}x${set.s2}`).join(' ');
                        const finalResult = match.done ? `${match.finalScore1}x${match.finalScore2}` : (match.p1.id===0 || match.p2.id===0 ? 'A definir' : '-');
                        const bonusPts = match.done ? `${match.points1} x ${match.points2}` : '-';
                        return [match.matchNumber || index+1, match.p1.name, match.p2.name, setResult, finalResult, bonusPts];
                    });
                    doc.autoTable({
                        head: tableHeadKO, body: tableBodyKO, startY: yPos, theme: 'grid',
                        headStyles: { fillColor: [220, 220, 220], textColor: 0 }, styles: { fontSize: 7, cellPadding: 1 }, // Fonte menor
                        columnStyles: { 0:{cellWidth: 8}, 1:{cellWidth: 40}, 2:{cellWidth: 40}, 3:{cellWidth: 47}, 4:{cellWidth: 15}, 5:{cellWidth: 15} } // Ajuste larguras
                    });
                     yPos = doc.lastAutoTable.finalY + 8;
                }
            }
        }
         yPos += 5; // Espaço extra entre categorias
    }
    doc.save('relatorio_geral_resultados_ctb.pdf');
}


// -----------------------------------------------------------------
// PASSO 10: FUNÇÕES AUXILIARES (Compactado)
// -----------------------------------------------------------------
function getCategoryDisplayName(categoryKey){const names={sub13:'Sub 13',sub15:'Sub 15',sub19:'Sub 19',adultoA:'Adulto A',adultoB:'Adulto B',veterano:'Veterano',feminino:'Feminino'};return names[categoryKey]||categoryKey;}
function createAlertElement(message,type='alert-info'){const alertDiv=document.createElement('div');alertDiv.className=`alert ${type}`;alertDiv.textContent=message;return alertDiv;}

// -----------------------------------------------------------------
// PASSO 11: INICIALIZAÇÃO
// -----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    showPage('home');
    updateDashboardCounts();
    renderAthletesTable();
});
