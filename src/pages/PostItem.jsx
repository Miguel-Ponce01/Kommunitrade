import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { MOCK_BARANGAYS } from '../data/mockData';

export default function PostItem() {
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleSimulateUpload = () => {
    // In a real app, this would be an input type="file" trigger
    // For this prototype, we simulate taking a photo
    setPreviewUrl("https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=400");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      alert("Item posted successfully!");
      navigate('/');
    }, 500);
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Sell an Item</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Item Photo (Required)</label>
          <div className="image-upload-area" onClick={handleSimulateUpload}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="preview-image" />
            ) : (
              <>
                <Camera size={48} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                <span style={{ fontWeight: 500 }}>Tap to Take Photo or Upload</span>
              </>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input type="text" className="form-control" placeholder="What are you selling?" required />
        </div>

        <div className="form-group">
          <label>Price (₱)</label>
          <input type="number" className="form-control" placeholder="e.g. 500" required />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select className="form-control" required defaultValue="">
            <option value="" disabled>Select category...</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing & Apparel</option>
            <option value="books">Books & Supplies</option>
            <option value="home">Home & Furniture</option>
            <option value="services">Local Services</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Your Barangay</label>
          <select className="form-control" required defaultValue="">
            <option value="" disabled>Where is the item located?</option>
            {MOCK_BARANGAYS.filter(b => b !== "All Barangays").map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea className="form-control" rows="3" placeholder="Condition, meetup details..."></textarea>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Post Listing Instantly
        </button>
      </form>
    </div>
  );
}
