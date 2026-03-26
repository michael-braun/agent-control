---
name: new-requirement
description: Neues Feature per Vibe-Coding entwickeln – von der Anforderung bis zur Umsetzung
---

# 🚀 Neues Feature entwickeln

Dieser Skill führt dich durch den gesamten Prozess: Anforderung verstehen, dokumentieren, umsetzen.
Kein manueller Code – alles wird per Vibe-Coding erledigt.

## Phase 1: Anforderung verstehen

### Schritt 1: Feature-Beschreibung aufnehmen

Frage den Nutzer: **"Was soll das neue Feature tun? Beschreibe es in eigenen Worten."**

### Schritt 2: Einordnung & Rückfragen

Lies die aktuelle `PROMPT.md` und die Projektstruktur (`src/`), um den Ist-Stand zu verstehen.

Prüfe kritisch:
- **Passt das Feature zur bestehenden Architektur?** (Commands in `src/commands/`, Tools in `src/tools/`, Utils in `src/utils/`)
- **Gibt es bereits ähnliche Funktionalität**, die erweitert statt neu gebaut werden sollte?
- **Widerspricht die Anforderung bestehenden Entscheidungen** in der PROMPT.md? (z.B. UX-Konventionen, Begriffe Command vs. Tool)
- **Ist die Anforderung vollständig?** Betrifft sie nur CLI, nur interaktiven Modus, oder beides?
- **Gibt es eine bessere Lösung** als das, was der Nutzer beschrieben hat?

Stelle gezielte Rückfragen, bis die Anforderung eindeutig ist. Sei dabei kritisch – schlage Alternativen vor, wenn du eine bessere Lösung siehst.

### Schritt 3: Anforderung bestätigen

Fasse die Anforderung strukturiert zusammen:
- Was wird gebaut (Command, Tool, oder beides)
- Welche bestehenden Dateien sind betroffen
- Welche neuen Dateien werden erstellt
- Ob Restrukturierung nötig ist

Frage: **"Passt diese Zusammenfassung? Soll ich so umsetzen?"**

## Phase 2: Dokumentation in PROMPT.md

### Schritt 4: PROMPT.md aktualisieren

Lies die aktuelle `PROMPT.md` und füge die neue Anforderung an der **passenden Stelle** ein:
- CLI-Commands → Abschnitt 2 (unter dem passenden Unterabschnitt)
- Interaktive Tools → Abschnitt 5 (unter dem passenden Unterabschnitt)
- Neue Querschnittslogik → eigener Abschnitt oder Erweiterung von Abschnitt 3/4
- Allgemeine Änderungen → Abschnitt 1

Halte den Stil und die Struktur der bestehenden Einträge bei.

## Phase 3: Umsetzung

### Schritt 5: Code implementieren

Setze das Feature um. Dabei:
- **Bestehende Patterns befolgen**: Schau dir an, wie ähnliche Commands/Tools aufgebaut sind, und folge dem gleichen Muster.
- **Kein duplizierter Code**: Wenn Logik in mehreren Dateien gebraucht wird → in `src/utils/` auslagern.
- **Restrukturierung durchführen**, wenn sie die Codebase verbessert (z.B. neues Unterverzeichnis in `utils/`, Extraktion gemeinsamer Logik).
- **Bestehende Imports und Exports** anpassen (z.B. `src/commands/index.ts`, `src/cli.ts`).
- **Interaktiven Modus** aktualisieren, falls das Feature dort verfügbar sein soll (`src/tools/interactive.ts`).

### Schritt 6: Build & Test

Führe aus:
1. `npm run build` – Kompiliert das Projekt. Behebe alle Fehler.
2. `npm test` – Führt bestehende Tests aus. Behebe alle Fehler, die durch die Änderungen entstanden sind.

Wiederhole bis beides fehlerfrei durchläuft.

### Schritt 7: Zusammenfassung

Zeige dem Nutzer:
- Welche Dateien erstellt/geändert wurden
- Was in der PROMPT.md ergänzt wurde
- Ob Restrukturierungen durchgeführt wurden
- Wie das Feature genutzt wird (CLI-Aufruf und/oder interaktiver Modus)
