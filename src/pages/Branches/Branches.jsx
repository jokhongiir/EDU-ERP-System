import './Branches.css';

export default function Branches({ branches, onSelect, onDelete, activeBranch }) {
  return (
    <div className="branches-container">
      <h3>All Branches</h3>
      {branches.length === 0 ? (
        <p>No branches yet</p>
      ) : (
        <ul>
          {branches.map(branch => (
            <li
              key={branch.id}
              className={activeBranch?.id === branch.id ? 'active' : ''}
            >
              <span onClick={() => onSelect(branch)}>{branch.name}</span>
              <button className="delete-btn" onClick={() => onDelete(branch.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}