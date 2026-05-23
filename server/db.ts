import fs from "fs/promises";
import path from "path";
import { AuditReport } from "../src/types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

interface DBStructure {
  reports: Record<string, AuditReport>;
  leads: Array<{
    id: string;
    reportId: string;
    email: string;
    companyName?: string;
    role?: string;
    teamSize?: number;
    timestamp: string;
  }>;
}

const defaultDB: DBStructure = {
  reports: {},
  leads: []
};

async function ensureDBEnabled() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify(defaultDB, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to initialize database folder", err);
  }
}

export async function readDB(): Promise<DBStructure> {
  await ensureDBEnabled();
  try {
    const raw = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(raw) as DBStructure;
  } catch (err) {
    console.error("Error reading database file, returning default schema", err);
    return defaultDB;
  }
}

export async function writeDB(data: DBStructure): Promise<void> {
  await ensureDBEnabled();
  try {
    const tempFile = `${DB_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tempFile, DB_FILE);
  } catch (err) {
    console.error("Error writing to database file safely", err);
  }
}

export async function getReport(id: string): Promise<AuditReport | null> {
  const db = await readDB();
  return db.reports[id] || null;
}

export async function saveReport(report: AuditReport): Promise<void> {
  const db = await readDB();
  db.reports[report.id] = report;
  await writeDB(db);
}

export async function addLead(lead: {
  reportId: string;
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: number;
}): Promise<void> {
  const db = await readDB();

  // Save lead in leads list
  const leadId = Math.random().toString(36).substring(2, 11);
  db.leads.push({
    id: leadId,
    ...lead,
    timestamp: new Date().toISOString()
  });

  // Link lead inside report as well
  if (db.reports[lead.reportId]) {
    db.reports[lead.reportId].leadCaptured = true;
    db.reports[lead.reportId].leadInfo = {
      email: lead.email,
      companyName: lead.companyName,
      role: lead.role,
      teamSize: lead.teamSize
    };
  }

  await writeDB(db);
}
