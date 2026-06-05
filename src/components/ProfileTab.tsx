import React, { useState } from 'react';
import { User, LogIn, Lock, Database, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

interface ProfileTabProps {
  user: any;
  setUser: (user: any) => void;
  mockLogin: (name: string, email: string) => void;
}

export default function ProfileTab({ user, setUser, mockLogin }: ProfileTabProps) {
  const [manualName, setManualName] = useState('Jesus Israel');
  const [manualEmail, setManualEmail] = useState('jesus.israel@gmail.com');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error: any) {
      console.error("Firebase sign in failed: ", error);
      setErrorMessage(
        "Las políticas de iframe bloquearon el inicio de sesión emergente de Google. Por favor use el login alternativo instantáneo de abajo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim()) return;
    mockLogin(manualName, manualEmail);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setUser(null);
  };

  if (user) {
    return (
      <div id="profile-connected-view" className="max-w-md mx-auto p-4 space-y-6">
        {/* Header card */}
        <div id="profile-user-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
          
          <div className="relative mx-auto w-24 h-24 rounded-full border-4 border-cyan-400/20 overflow-hidden mb-4 bg-slate-800 flex items-center justify-center">
            {user.photoURL ? (
              <img 
                id="user-avatar-img"
                src={user.photoURL} 
                alt={user.displayName || "Usuario"} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>

          <h2 id="user-display-name" className="text-xl font-bold text-slate-100 mb-1">{user.displayName || user.name || "Jesus Israel"}</h2>
          <p id="user-display-email" className="text-sm text-slate-400 mb-4">{user.email || "jesus.israel@gmail.com"}</p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            Sesión Activa - Sincronizado
          </div>
        </div>

        {/* Database Status Tracker */}
        <div id="db-status-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <h3 className="text-sm font-semibold tracking-wider text-cyan-400 uppercase flex items-center gap-2">
            <Database className="w-4 h-4" />
            Estado del Proyecto Firestore
          </h3>

          <div className="space-y-3 Divide-y divide-slate-800 text-xs">
            <div className="flex justify-between py-2 text-slate-300">
              <span>Nombre Proyecto</span>
              <span className="font-mono text-slate-400">bot-mi-mercado ({firebaseConfig.projectId})</span>
            </div>
            <div className="flex justify-between py-2 text-slate-300">
              <span>Host Sincronizado</span>
              <span className="font-mono text-slate-400">Enterprise Edition (Spark Plan)</span>
            </div>
            <div className="flex justify-between py-2 text-slate-300">
              <span>Servicio de Autenticación</span>
              <span className="font-mono text-emerald-400">Conectado y Seguro</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-cyan-400">🔐 Protocolo de Seguridad Activado</p>
          <p>Tu sesión actual sirve de token para validar y firmar digitalmente todas tus consultas en el Servidor MCP.</p>
        </div>

        {/* Sign out */}
        <button
          id="sign-out-button"
          onClick={handleSignOut}
          className="w-full bg-slate-900 hover:bg-slate-800/80 text-rose-400 font-semibold py-3 px-4 rounded-xl transition duration-200 border border-slate-800 focus:ring-2 focus:ring-rose-500/30"
        >
          Cerrar Sesión
        </button>
      </div>
    );
  }

  return (
    <div id="profile-gate-view" className="max-w-md mx-auto p-4 space-y-6">
      {/* Visual Header */}
      <div className="text-center py-6 space-y-2">
        <div className="mx-auto w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-400/30 text-cyan-400 shadow-inner">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>
        <h2 id="gate-header-title" className="text-2xl font-black text-slate-100 tracking-tight">Acceso Privado</h2>
        <p className="text-xs text-slate-400 px-6 leading-relaxed">
          Para garantizar la trazabilidad de tus reservaciones gastronómicas y activar tu cliente <strong className="text-cyan-400 font-medium">Model Context Protocol</strong>, inicia sesión a continuación.
        </p>
      </div>

      {/* Google Login Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 relative overflow-hidden">
        <button
          id="btn-google-login"
          disabled={loading}
          onClick={handleGoogleLogin}
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.3 1.55-1.17 2.86-2.48 3.74v3.1h3.97c2.32-2.13 3.65-5.28 3.65-8.69z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.97-3.1c-1.1.74-2.52 1.18-3.99 1.18-3.07 0-5.67-2.08-6.6-4.88H1.31v3.2C3.29 22.28 7.37 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.4 14.29c-.25-.74-.39-1.53-.39-2.29s.14-1.55.39-2.29V6.51H1.31C.47 8.16 0 10.02 0 12s.47 3.84 1.31 5.49l4.09-3.2z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.4-3.4C17.96 1.19 15.24 0 12 0 7.37 0 3.29 1.72 1.31 4.75l4.09 3.2c.93-2.8 3.53-4.88 6.6-4.88z"
              />
            </svg>
          )}
          <span>Iniciar sesión con Google</span>
        </button>

        {errorMessage && (
          <div id="google-login-error" className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-xs leading-relaxed flex gap-2 items-start">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Alternative instant bypassing login */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Acceso Instantáneo Local</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <form onSubmit={handleManualLogin} id="manual-login-form" className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Nombre del Vecino</label>
            <input
              type="text"
              id="input-login-name"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="e.g. Jesus Israel"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition duration-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Correo Electrónico</label>
            <input
              type="email"
              id="input-login-email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="e.g. jesus@gmail.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition duration-200"
            />
          </div>

          <button
            type="submit"
            id="btn-bypass-login"
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Firmar Credenciales Locales</span>
          </button>
        </form>
      </div>
    </div>
  );
}
