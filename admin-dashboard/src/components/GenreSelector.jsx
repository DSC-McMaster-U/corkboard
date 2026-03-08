import { useState, useRef, useEffect } from "react";

export default function GenreSelector({ allGenres, selectedGenreIds, onChange }) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedGenres = (allGenres || []).filter(g => selectedGenreIds?.includes(g.id));

    const suggestions = (allGenres || []).filter(g =>
        !selectedGenreIds?.includes(g.id) &&
        g.name.toLowerCase().includes(query.toLowerCase())
    );

    const removeGenre = (id) => {
        onChange(selectedGenreIds.filter(gid => gid !== id));
    };

    const addGenre = (id) => {
        onChange([...(selectedGenreIds || []), id]);
        setQuery("");
        setIsOpen(false);
    };

    return (
        <div className="genre-selector" ref={containerRef}>
            <div style={{ marginBottom: 12 }}>Genres</div>
            <div className="tags-container" onClick={() => setIsOpen(true)}>
                {selectedGenres.map(genre => (
                    <span key={genre.id} className="genre-pill">
                        {genre.name}
                        <span className="remove-btn" onClick={(e) => {
                            e.stopPropagation();
                            removeGenre(genre.id);
                        }}>&times;</span>
                    </span>
                ))}
                <input
                    className="genre-search-input"
                    placeholder={selectedGenres.length === 0 ? "Search genres..." : ""}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="genre-suggestions">
                    {suggestions.map(genre => (
                        <div
                            key={genre.id}
                            className="suggestion-item"
                            onClick={() => addGenre(genre.id)}
                        >
                            {genre.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
