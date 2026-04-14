import { useEffect, useState, useRef } from "react";
import { Search, ChevronDown, Menu } from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import "./Navbar.css";

export default function Navbar({ activeBranch, branches, setActiveBranch, centerName: centerNameProp, toggleSidebar }) {
  const [centerName, setCenterName] = useState(centerNameProp || "");
  const [user, setUser] = useState(null);
  const [branchOpen, setBranchOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => { if(centerNameProp) setCenterName(centerNameProp); }, [centerNameProp]);

  useEffect(() => {
    const fetchUser = async () => {
      if(centerName) return;
      const { data } = await supabase.auth.getUser();
      if(!data.user) return;
      setUser(data.user);
      setCenterName(data.user.user_metadata?.centerName || "Education ERP System");
    }
    fetchUser();
  }, [centerName]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setBranchOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Hamburger tugma har doim ko‘rinadi */}
        <button className="hamburger" onClick={toggleSidebar}><Menu size={24} /></button>

        <h1 className="center-name">{centerName || "Loading..."}</h1>

        <div className="search-container">
          <Search size={18} />
          <input type="text" placeholder="Search..." />
        </div>
      </div>

      <div className="navbar-right">
        <div className="branch-dropdown" ref={dropdownRef}>
          <button className={`branch-btn ${branchOpen ? "open" : ""}`} onClick={() => setBranchOpen(!branchOpen)}>
            {activeBranch?.name || "Select Branch"} 
            <ChevronDown size={16} className={branchOpen ? "rotated" : ""}/>
          </button>
          <div className={`dropdown-menu ${branchOpen ? "show" : ""}`}>
            {branches.map(b => (
              <div key={b.id} className={`dropdown-item ${activeBranch?.id===b.id?"active":""}`} onClick={() => {setActiveBranch(b); setBranchOpen(false)}}>
                {b.name}
              </div>
            ))}
          </div>
        </div>

        <div className="user-info">
          <div className="avatar">{user?.email?.charAt(0).toUpperCase()}</div>
          <span className="user-email">{user?.email}</span>
        </div>
      </div>
    </header>
  )
}