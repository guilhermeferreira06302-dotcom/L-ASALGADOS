import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export const SystemSettings: React.FC = () => {
  const { sendWhatsAppAlert } = useApp();
  
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [inactivityTimeout, setInactivityTimeout] = useState(120); // minutes
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettingsId(data.id);
        setWhatsappNumber(data.whatsapp_number || '');
        setApiKey(data.whatsapp_api_key || '');
        setAlertsEnabled(data.alerts_enabled || false);
        setInactivityTimeout(data.inactivity_timeout_minutes || 120);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        whatsapp_number: whatsappNumber,
        whatsapp_api_key: apiKey,
        alerts_enabled: alertsEnabled,
        inactivity_timeout_minutes: inactivityTimeout
      };

      if (settingsId) {
        // Atualiza
        const { error } = await supabase
          .from('system_settings')
          .update(payload)
          .eq('id', settingsId);
        if (error) throw error;
      } else {
        // Insere novo
        const { data, error } = await supabase
          .from('system_settings')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        if (data) setSettingsId(data.id);
      }
      alert('Configurações salvas com sucesso!');
    } catch (error: any) {
      alert('Erro ao salvar configurações: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const testAlert = () => {
    sendWhatsAppAlert(`Teste de Notificação Sabor & Gestão!\nSe você recebeu esta mensagem, as configurações estão corretas.\nHorário: ${new Date().toLocaleString('pt-BR')}`);
    alert('Tentativa de envio iniciada. Verifique seu WhatsApp.');
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl max-w-4xl mx-auto">
      <div className="mb-8 border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-amber-500">⚙️</span> Configurações do Sistema
        </h2>
        <p className="text-slate-400 mt-1 text-sm">
          Gerencie alertas, integrações e parâmetros gerais.
        </p>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700/50">
        <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
          📱 Alertas no WhatsApp (via CallMeBot)
        </h3>

        <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg mb-6">
          <h4 className="text-amber-500 font-semibold mb-2">Instruções para ativar:</h4>
          <ol className="list-decimal list-inside text-sm text-amber-200/80 space-y-1">
            <li>Adicione o número do bot na sua agenda. (Ex: +34 695 71 15 19 - verifique o site oficial do CallMeBot para o número atual).</li>
            <li>Mande uma mensagem no WhatsApp para este número com o texto: <code className="bg-slate-800 px-1 rounded">I allow callmebot to send me messages</code></li>
            <li>O bot responderá com a sua <strong>API Key</strong>.</li>
            <li>Preencha seu número (com código do país, sem o +) e a API Key abaixo.</li>
          </ol>
        </div>

        {isLoading ? (
          <div className="text-slate-400 text-center py-4">Carregando configurações...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="enableAlerts"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded bg-slate-800 border-slate-600 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
              <label htmlFor="enableAlerts" className="text-slate-200 font-medium">
                Ativar envio de Alertas no WhatsApp (Erros e Inatividade)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Seu Número de WhatsApp (Ex: 5511999999999)
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Apenas números, com DDI"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                  disabled={!alertsEnabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Chave de API (CallMeBot)
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Sua API Key"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                  disabled={!alertsEnabled}
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Alerta de Inatividade (em minutos)
              </label>
              <p className="text-xs text-slate-500 mb-2">Se um turno estiver ABERTO, mas não houver nenhuma venda ou movimentação nesse período de tempo, o sistema enviará um alerta de possível inatividade (para prevenir que operadores parem de registrar as vendas).</p>
              <input
                type="number"
                value={inactivityTimeout}
                onChange={(e) => setInactivityTimeout(Number(e.target.value))}
                min="1"
                className="w-full md:w-1/3 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                disabled={!alertsEnabled}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </button>

              <button
                onClick={testAlert}
                disabled={!alertsEnabled || !whatsappNumber || !apiKey}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 px-6 rounded-lg shadow-lg transition-all disabled:opacity-50"
              >
                Enviar Mensagem de Teste
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
