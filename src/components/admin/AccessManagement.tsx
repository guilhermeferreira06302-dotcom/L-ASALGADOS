import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { Shield, Key, User as UserIcon, Check, AlertTriangle, Plus, Trash2, X } from 'lucide-react';

export const AccessManagement: React.FC = () => {
  const { users, currentUser, updateUser, addUser, deleteUser } = useApp();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Local state for editing form
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  
  // Local state for create form
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'FUNCIONARIO'>('FUNCIONARIO');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditPassword(user.password || '');
    setIsCreating(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditName('');
    setEditPassword('');
    setErrorMsg('');
  };

  const handleSaveEdit = (user: User) => {
    if (!editName.trim() || !editPassword.trim()) {
      showMessage('O nome de acesso e a senha não podem ficar vazios.', true);
      return;
    }

    const existing = users.find(u => u.name.toLowerCase() === editName.toLowerCase() && u.id !== user.id);
    if (existing) {
      showMessage('Este nome já está sendo utilizado por outro usuário.', true);
      return;
    }

    updateUser({
      ...user,
      name: editName,
      password: editPassword
    });

    showMessage(`Credenciais atualizadas com sucesso!`);
    setEditingUserId(null);
  };

  const handleCreate = () => {
    if (!newName.trim() || !newPassword.trim()) {
      showMessage('Nome e senha são obrigatórios.', true);
      return;
    }

    const existing = users.find(u => u.name.toLowerCase() === newName.toLowerCase());
    if (existing) {
      showMessage('Este nome já está sendo utilizado por outro usuário.', true);
      return;
    }

    addUser({
      name: newName,
      password: newPassword,
      role: newRole,
      position: newRole === 'ADMIN' ? 'Administrador' : 'Funcionário',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    });

    showMessage(`Acesso para ${newName} criado com sucesso!`);
    setIsCreating(false);
    setNewName('');
    setNewPassword('');
  };

  const handleDelete = (id: string, name: string) => {
    if (id === currentUser?.id) {
      showMessage('Você não pode excluir o seu próprio acesso.', true);
      return;
    }
    if (confirm(`Tem certeza que deseja excluir o acesso de ${name}?`)) {
      deleteUser(id);
      showMessage(`Acesso de ${name} excluído com sucesso!`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header section */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            <span>Gerenciamento de Acessos</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Crie, altere ou remova nomes e senhas dos usuários que têm acesso ao sistema.
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingUserId(null);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-md cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Acesso</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-700">
          <Check className="w-5 h-5" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Creation Modal/Form Inline */}
      {isCreating && (
        <div className="bg-white border-2 border-slate-900 p-6 rounded-3xl shadow-2xl relative animate-in slide-in-from-top-4 duration-200">
          <button 
            onClick={() => setIsCreating(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-900" />
            Cadastrar Novo Acesso
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nome Completo (Login)</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Senha de Acesso</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>
            <div className="md:col-span-2 mt-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Nível de Acesso (Permissões)</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="role" 
                    checked={newRole === 'FUNCIONARIO'}
                    onChange={() => setNewRole('FUNCIONARIO')}
                    className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-800">Funcionário (Caixa e PDV)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="role" 
                    checked={newRole === 'ADMIN'}
                    onChange={() => setNewRole('ADMIN')}
                    className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm font-semibold text-slate-800">Administrador (Acesso Total)</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsCreating(false)}
              className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition cursor-pointer"
            >
              Criar Acesso
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl flex flex-col gap-4 relative overflow-hidden group">
            
            {/* Delete button (top right) */}
            {user.id !== currentUser?.id && (
              <button 
                onClick={() => handleDelete(user.id, user.name)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition cursor-pointer opacity-0 group-hover:opacity-100"
                title="Excluir Acesso"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-4 pr-10">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm group-hover:scale-105 transition duration-300" 
              />
              <div className="flex-1">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  {user.name}
                  {user.id === currentUser?.id && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-white uppercase tracking-wider">Você</span>
                  )}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold border ${
                  user.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-600 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                }`}>
                  {user.role}
                </span>
                <p className="text-xs text-slate-500 mt-1">{user.position}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              {editingUserId === user.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nome de Acesso (Login)</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nova Senha</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleSaveEdit(user)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 rounded-xl transition cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Login (Nome)</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Senha</p>
                      <p className="text-sm font-medium text-slate-900 tracking-[0.2em]">••••••••</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => startEdit(user)}
                    className="w-full mt-2 py-2 border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100 text-sm font-bold rounded-xl transition cursor-pointer"
                  >
                    Alterar Acesso
                  </button>
                </div>
              )}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
};
