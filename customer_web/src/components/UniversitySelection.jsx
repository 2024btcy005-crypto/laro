import React, { useState, useEffect } from 'react';
import { universityAPI } from '../api';
import { School, Check, ArrowRight, Loader2, MapPin, Search } from 'lucide-react';
import './UniversitySelection.css';

export default function UniversitySelection({ onSelect }) {
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchUniversities();
    }, []);

    const fetchUniversities = async () => {
        try {
            const res = await universityAPI.getAll();
            setUniversities(res.data);
        } catch (err) {
            setError('Failed to load campuses. Please check your connection.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        const selected = universities.find(u => u.id === selectedId);
        if (selected) {
            localStorage.setItem('selectedUniversityId', selected.id);
            localStorage.setItem('selectedUniversityName', selected.name);
            onSelect(selected);
        }
    };

    const filteredUniversities = universities.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.address && u.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return (
        <div className="uni-selection-overlay">
            <div className="uni-selection-card loading">
                <Loader2 className="animate-spin" size={48} color="#ec4899" />
                <p>Finding campuses near you...</p>
            </div>
        </div>
    );

    return (
        <div className="uni-selection-overlay">
            <div className="uni-selection-card">
                <div className="uni-header">
                    <div className="uni-icon-circle">
                        <School size={32} color="#ec4899" />
                    </div>
                    <h2>Select Your Campus</h2>
                    <p>Choose your university to see the best spots serving your location.</p>
                </div>

                {error && <div className="uni-error">{error}</div>}

                <div className="uni-search-container">
                    <Search size={18} className="uni-search-icon" />
                    <input
                        type="text"
                        placeholder="Search for your campus..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="uni-search-input"
                    />
                </div>

                <div className="uni-list">
                    {filteredUniversities.map(uni => (
                        <div
                            key={uni.id}
                            className={`uni-item ${selectedId === uni.id ? 'selected' : ''}`}
                            onClick={() => setSelectedId(uni.id)}
                        >
                            <div className="uni-item-info">
                                <h3>{uni.name}</h3>
                                <p><MapPin size={12} /> {uni.address || 'Campus Location'}</p>
                            </div>
                            {selectedId === uni.id && <div className="uni-check"><Check size={20} /></div>}
                        </div>
                    ))}

                    {filteredUniversities.length === 0 && !loading && (
                        <div className="uni-empty">
                            <p>{searchQuery ? 'No campuses match your search.' : 'No universities found. Please try again later.'}</p>
                        </div>
                    )}
                </div>

                <button
                    className="uni-confirm-btn"
                    disabled={!selectedId}
                    onClick={handleConfirm}
                >
                    <span>Continue to Store</span>
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}
