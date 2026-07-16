"use client";

import { useEffect, useState } from "react";

// Same-origin: /api is routed to the nodejs backend by the Ingress, so the
// counter proves the 3-tier path (nginx -> Node.js -> PostgreSQL) end to end.
export default function VisitCounter() {
  const [label, setLabel] = useState("...");

  useEffect(() => {
    fetch("/api/visit")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "Healthy") {
          setLabel(String(data.total_visits));
        } else {
          setLabel("api error");
        }
      })
      .catch(() => setLabel("api offline"));
  }, []);

  return (
    <span className="rounded-full border border-surface0 bg-base px-3 py-1 text-sub">
      views <span className="text-overlay">·</span> <span className="text-yellow">{label}</span>
    </span>
  );
}
