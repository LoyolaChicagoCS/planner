export default function SearchBox({ value, onChange, placeholder = 'Search' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-maroon-300 focus:bg-white"
        placeholder={placeholder}
        type="search"
      />
    </div>
  );
}
