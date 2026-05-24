import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Loader, CheckCircle, AlertCircle, Shield, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as SupabaseUser } from '@supabase/supabase-js';
import {
  validateApiKey,
  saveUserApiKey,
  loadUserApiKey,
  removeUserApiKey,
  encryptApiKey,
  decryptApiKey,
} from '../../services/aiService';

interface APIKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser;
  onKeyChange: (key: string) => void;
  currentKey: string;
}

export function APIKeySettings({
  isOpen,
  onClose,
  user,
  onKeyChange,
  currentKey,
}: APIKeySettingsProps) {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid' | 'saved'>('idle');
  const [error, setError] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadUserApiKey(user.id).then((encrypted) => {
        if (encrypted) {
          const decrypted = decryptApiKey(encrypted);
          if (decrypted) {
            setHasStoredKey(true);
            setKeyInput(decrypted);
            setStatus('saved');
          }
        }
      });
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (currentKey) {
      setHasStoredKey(true);
      setStatus('saved');
    }
  }, [currentKey]);

  const handleValidate = async () => {
    if (!keyInput.trim()) return;
    setValidating(true);
    setError('');
    setStatus('idle');

    const result = await validateApiKey(keyInput.trim());
    setValidating(false);

    if (result.valid) {
      setStatus('valid');
    } else {
      setStatus('invalid');
      setError(result.error || 'Invalid API key');
    }
  };

  const handleSave = async () => {
    if (!keyInput.trim() || status === 'invalid') return;

    if (status !== 'valid' && status !== 'saved') {
      await handleValidate();
      return;
    }

    setSaving(true);
    const encrypted = encryptApiKey(keyInput.trim());
    await saveUserApiKey(user.id, encrypted);
    onKeyChange(keyInput.trim());
    setHasStoredKey(true);
    setStatus('saved');
    setSaving(false);
  };

  const handleRemove = async () => {
    await removeUserApiKey(user.id);
    onKeyChange('');
    setKeyInput('');
    setHasStoredKey(false);
    setStatus('idle');
    setError('');
  };

  const handleClose = () => {
    setShowKey(false);
    onClose();
  };

  const maskedKey = keyInput
    ? keyInput.slice(0, 7) + '...' + keyInput.slice(-4)
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/10 p-2.5 rounded-xl">
                    <Key className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">AI Settings</h2>
                    <p className="text-slate-400 text-xs">Configure your OpenAI API key</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Info */}
              <div className="flex items-start space-x-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Your key is stored securely</p>
                  <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                    Your API key is encrypted and stored in your user settings. It is only sent to
                    OpenAI through our secure edge function and never exposed in client-side logs.
                  </p>
                </div>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">OpenAI API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => {
                      setKeyInput(e.target.value);
                      if (status !== 'idle') setStatus('idle');
                      setError('');
                    }}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-all font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      type="button"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {hasStoredKey && !showKey && status === 'saved' && (
                  <p className="text-xs text-gray-500 font-mono">{maskedKey}</p>
                )}
              </div>

              {/* Status */}
              <AnimatePresence mode="wait">
                {status === 'valid' && (
                  <motion.div
                    key="valid"
                    className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2.5 rounded-xl"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">API key is valid</span>
                  </motion.div>
                )}
                {status === 'invalid' && (
                  <motion.div
                    key="invalid"
                    className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2.5 rounded-xl"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{error}</span>
                  </motion.div>
                )}
                {status === 'saved' && (
                  <motion.div
                    key="saved"
                    className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">API key saved and active</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleValidate}
                  disabled={!keyInput.trim() || validating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  {validating ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Validate</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSave}
                  disabled={!keyInput.trim() || status === 'invalid' || saving}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-all shadow-md"
                >
                  {saving ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      <span>Save Key</span>
                    </>
                  )}
                </button>
              </div>

              {hasStoredKey && (
                <button
                  onClick={handleRemove}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove API Key</span>
                </button>
              )}

              {/* Help */}
              <div className="text-xs text-gray-400 leading-relaxed">
                <p>
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    platform.openai.com/api-keys
                  </a>
                  . The AI planner uses GPT-4o for strategic planning and task optimization, and
                  GPT-4o-mini for scheduling and budget analysis.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
