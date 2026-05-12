import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function Messages() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '1.5rem' }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'var(--primary-light)',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--primary)',
      }}>
        <MessageCircle size={40} />
      </div>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.5rem' }}>Messages</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '320px' }}>
          Your conversation history will appear here. Start a chat by contacting a seller on an item listing.
        </p>
      </div>
    </div>
  );
}
