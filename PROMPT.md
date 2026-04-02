# agent-control-cli – Anforderungen (PROMPT.md)

> Diese Datei ist die führende Anforderungsdokumentation für das Projekt.
> Sie dient als "Vibe"-Referenz für die Weiterentwicklung.

---

## 1 Allgemein

### 1.1 Projektstruktur & Technologie

- Node.js CLI-Tool, global installierbar (`npm install -g`).
- TypeScript, sauber aufgeteilt in mehrere Dateien.
- Commands (CLI) in eigenem Ordner, Tools (interaktiv) in eigenem Ordner.
- Utility-Funktionen geclustert (z.B. `utils/filesystem`, `utils/config`, …).
- Gemeinsame Ansichten (z.B. Agent-Info) in eigene Dateien auslagern – kein duplizierter Code.
- Unit-Tests mit **vitest**.

### 1.2 Konfiguration & Datenhaltung

- Konfigurationsdatei: `~/.agent-control/config.json`
- Geklonte Repositories: `~/.agent-control/repos/`
- Installierte Agenten: `~/.agent-control/agents/`
- Installierte Skills: `~/.agent-control/skills/`
- Kiro-Agent-Symlinks: `~/.kiro/agents/`
- Kiro-Skill-Symlinks: `~/.kiro/skills/`

### 1.3 Begriffe

| Begriff     | Bedeutung |
|-------------|-----------|
| **Command** | Per CLI angebotenes Kommando: `agent-control <command-name> [args]` |
| **Tool**    | Intern im interaktiven Modus angebotene Funktion |

### 1.4 UX-Konventionen (interaktiver Modus)

- Interaktive Listen mit Aktionen haben standardmäßig **Back** ausgewählt.
- Die Back-Option hat immer einen **Zurück-Pfeil** (←) vor dem Text.
- Agenten werden immer mit **Repository-Name** (farblich hinterlegt) angezeigt.
  - Hinter dem Repository-Namen: **grüner Punkt** = Git-Support, **oranger Punkt** = kein Git.
- Git-Support-Status wird grün (aktiv) oder orange (deaktiviert) hervorgehoben.
- Schöne Icons (mit Space getrennt) vor Menüeinträgen.

---

## 2 CLI-Commands

### 2.1 Repository-Management

#### `add-repo <url-or-path> <name>`

- Nimmt eine Git-SSH-URL oder einen lokalen Pfad entgegen.
- Speichert das Repository unter `~/.agent-control/repos/<name>`.
- Führt nach dem Hinzufügen die **Repository-Analyse** durch (→ Abschnitt 3).

#### `remove-repo <name>`

- Entfernt ein Repository.
- Wenn noch installierte/aktive Agents aus dem Repository existieren, wird das Entfernen **abgelehnt** (Fehlermeldung).

#### `list-repos`

- Listet alle konfigurierten Repositories auf.

### 2.2 Agenten-Management

#### `install <repo> <agent-id>`

- Aktiviert einen Agenten. Details zum Installationsprozess → Abschnitt 4.
- Fehler, wenn der Agent bereits installiert ist.

#### `uninstall <repo> <agent-id>`

- Deaktiviert einen Agenten.
- Passt `config.json` an und entfernt alle zugehörigen Symlinks.

#### `list`

- Listet alle aktuell installierten/aktiven Agenten auf.

#### `list-available <repo>`

- Listet alle bekannten und analysierten Agents aus dem angegebenen Repository auf.

#### `info <repo> <agent-id>`

- Zeigt detaillierte Informationen zu einem Agenten: Name, Description, Repository, bekannte Dateien.
- Zeigt den aktuellen Status (installiert / nicht installiert).

### 2.3 Skills-Management

#### `install-skill <repo> <skill-id>`

- Aktiviert einen Skill. Details zum Installationsprozess → Abschnitt 4.1.
- Fehler, wenn der Skill bereits installiert ist.

#### `uninstall-skill <repo> <skill-id>`

- Deaktiviert einen Skill.
- Passt `config.json` an und entfernt alle zugehörigen Symlinks.

#### `list-skills`

- Listet alle aktuell installierten/aktiven Skills auf.

#### `list-available-skills <repo>`

- Listet alle bekannten und analysierten Skills aus dem angegebenen Repository auf.

#### `skill-info <repo> <skill-id>`

- Zeigt detaillierte Informationen zu einem Skill: Name, Description, Repository, Dateien.
- Zeigt den aktuellen Status (installiert / nicht installiert).

### 2.4 Steering-Management

#### `list-available-steerings <repo>`

- Listet alle erkannten Steering-Ordner aus dem angegebenen Repository auf.
- Zeigt Name, Beschreibung und enthaltene `.md`-Dateien an.

### 2.5 Wartung

#### `update`

- Aktualisiert alle Repositories (Git-Repos: `git pull`).
- Bricht mit Fehlermeldung ab, wenn uncommittete Änderungen in einem Git-Repository vorliegen.
- Führt anschließend die Repository-Analyse und den `cleanup`-Command aus.
- Speichert den Zeitpunkt des letzten Updates in den Meta-Daten.

#### `cleanup`

- Entfernt alle erstellten Symlinks.
- Schaut sich alle aktiven Agenten an und erstellt die Symlinks erneut.

#### `doctor`

- Erkennt und behebt automatisch fehlerhafte Stände:
  - Fehler mit Git-Repositories
  - Fehlerhafte Symlinks
  - Fehlerhafte oder inkonsistente Config-Dateien
  - Agenten, die nicht mehr im Repository enthalten, aber noch lokal installiert sind
- Jedes Problem wird in einer eigenen Funktion/Datei analysiert (unter `utils/doctor/`).

---

## 3 Repository-Analyse

Wird ausgeführt bei: `add-repo`, `update`.

### 3.1 Agent-Analyse

1. Alle `.json`-Dateien (rekursiv) im Repository durchsuchen, die `name`, `description` und `prompt` enthalten.
2. Wenn die JSON-Datei ein Feld `id` hat, wird dieses als Identifier genutzt; sonst der Pfad zur JSON-Datei.
3. Der Identifier wird zusammen mit dem Repository-Namen **gehasht** → ergibt die Agent-ID.
4. Ergebnisse werden in `~/.agent-control/repos/<name>.meta.json` unter dem Property `agents` gespeichert.
5. Letzte Analyse-/Update-Zeit des Repositories wird in den Meta-Informationen gespeichert.

#### 3.1.1 Prompt-Analyse

- Wenn `prompt` eine `file://`-URL zu einer `.md`-Datei ist:
  - Die Datei wird analysiert und nach referenzierten/verlinkten Dateien durchsucht (rekursiv).
  - Zirkuläre Abhängigkeiten werden erkannt (keine Datei doppelt analysieren).

#### 3.1.2 Resources-Analyse

- Gleiche Analyse wie beim `prompt`-Feld für alle Pfade im `resources`-Array.
- URLs mit Protokoll `skill://` werden entsprechend verarbeitet.
- Dateien müssen mit **absoluten Pfaden** referenziert werden.

#### 3.1.3 `skill://`-Referenzen

- Im Repo referenziert ein Agent Skills über `skill://<relativer-pfad-im-repo>` (z.B. `skill://skills/my-skill/SKILL.md`).
- Der Pfad ist relativ zum Repo-Verzeichnis und entspricht dem **Verzeichnisnamen** des Skills.
- Bei der Agent-Installation (→ Abschnitt 4) wird jede `skill://`-Referenz aufgelöst:
  1. Skill-Verzeichnisname aus dem Pfad extrahieren.
  2. Passenden Skill im selben Repo via Meta-Daten suchen.
  3. Ist der Skill noch nicht installiert → wird er **automatisch mit-installiert**.
  4. Ist der Skill im Repo nicht bekannt → **Fehler, Abbruch mit Rollback**.
  5. Im kopierten Agent-JSON wird `skill://skills/my-skill/SKILL.md` ersetzt durch `skill://~/.kiro/skills/agent-control_<skill-hash>/SKILL.md`.

### 3.2 Skill-Analyse

1. Im Repository wird das Verzeichnis `skills/` auf Top-Level durchsucht.
2. Jedes Unterverzeichnis, das eine `SKILL.md`-Datei enthält, wird als Skill erkannt.
3. Aus der `SKILL.md` werden `name` und `description` aus dem YAML-Frontmatter extrahiert.
4. Skill-ID = Hash aus `repoName:skillName`.
5. Alle Dateien im Skill-Verzeichnis (inkl. `references/`) werden als bekannte Dateien erfasst.
6. Ergebnisse werden in `~/.agent-control/repos/<name>.meta.json` unter dem Property `skills` gespeichert.

### 3.3 Steering-Analyse

1. Im Repository wird das Verzeichnis `steering/` auf Top-Level gesucht.
2. Es muss eine `steering.json` mit `name` und `description` enthalten sein.
3. Alle `.md`-Dateien im `steering/`-Verzeichnis werden als Steering-Dateien erfasst.
4. Ergebnisse werden in `~/.agent-control/repos/<name>.meta.json` unter dem Property `steerings` gespeichert.
5. Steering-Dateien können in Agent-JSONs unter `resources` per `file://`-Relativpfad referenziert werden (z.B. `file://../../steering/structure.md`). Die bestehende `file://`-Mechanik (Analyse, Kopieren, Pfad-Rewriting) greift automatisch.

---

## 4 Installationsprozess (Agent aktivieren)

1. Agent (id, repo, name) wird in `config.json` eingetragen.
2. Die JSON-Datei wird nach `~/.agent-control/agents/<agent-id>/<agent-id>.json` kopiert.
   - Pfade zu bekannten Dateien werden angepasst: Prefix `./agent-control_<agent-id>/` (kein doppeltes `./`).
   - Angepasste Pfade beginnen immer mit `./`.
   - Das Property `id` wird aus der Datei entfernt.
3. Alle weiteren Dateien werden nach `~/.agent-control/agents/<agent-id>/files` kopiert.
4. Symlinks werden in `~/.kiro/agents/` erstellt:
   - JSON: `agent-control_<agent-id>.json`
   - Files-Ordner: `agent-control_<agent-id>/` (Ordner-Symlink)
   - Symlinks erhalten **keinen zusätzlichen Prefix** – gleiche Struktur wie im Repo-Verzeichnis.
5. Alle Symlinks werden in `config.json` unter `symlinks` dokumentiert (inkl. der Agent-IDs, die diese Datei brauchen).
6. **Rollback**: Wenn die Installation abbricht (z.B. Symlink existiert bereits), werden alle bereits erstellten Symlinks zurückgerollt.

### 4.1 Installationsprozess (Skill aktivieren)

1. Skill (id, repo, name) wird in `config.json` unter `skills` eingetragen.
2. Das gesamte Skill-Verzeichnis wird nach `~/.agent-control/skills/<skill-id>/` kopiert.
3. Ordner-Symlink in `~/.kiro/skills/` als `agent-control_<skill-id>/`.
4. Symlink wird in `config.json` unter `symlinks` dokumentiert.
5. **Rollback**: Analog zu Agents.

---

## 5 Interaktiver Modus (Tools)

Wird gestartet mit `agent-control` (ohne Argumente) oder `agent-control interactive`.

### 5.1 Hauptmenü

Reihenfolge der Einträge (jeweils mit Icon):

1. 🔄 Update
2. 📚 Manage Repositories
3. 🤖 Agents
4. 📝 Skills
5. 🩺 Doctor
6. 🧹 Cleanup

### 5.2 Repository-Management (Tool)

#### Repositories anzeigen (`list-repos`)

- Zeigt alle Repositories an.
- Ermöglicht den Wechsel zu `add-repo`.

#### Repository auswählen → Detail-Ansicht

- Zeigt: Name, Total Agents, Installed Agents, Git-Support, Letztes Update.
- Git-Support farblich hervorgehoben (grün = aktiv, orange = deaktiviert).
- Aktionen: Repository löschen, Repository aktualisieren.

#### Repository hinzufügen (`add-repo`)

- Interaktive Abfrage: SSH-URL oder Pfad, Name.
- Nutzt intern den `add-repo`-Command.

#### Repository entfernen (`remove-repo`)

- Nutzt intern den `remove-repo`-Command.
- Fehlermeldung, wenn noch Agents installiert sind.

### 5.3 Agenten-Management (Tool: Agents)

Zentrales Tool für alle Agenten-Operationen. Nutzt `@inquirer/checkbox` für direkte Selektion/Deselektion.

#### Übersicht

- Zeigt **alle** Agents aus allen Repositories in einer einheitlichen Checkbox-Liste.
- Installierte Agents sind **vorausgewählt** (Checkbox aktiv).
- **Leertaste** togglet Aktivierung/Deaktivierung eines Agenten direkt in der Liste.
- **Enter** bestätigt die Auswahl und führt die Änderungen sofort durch.

#### Ablauf nach Bestätigung (Enter)

- Neu aktivierte Agents werden installiert.
- Abgewählte (zuvor installierte) Agents werden deinstalliert.
- Wenn keine Änderungen vorliegen, wird eine entsprechende Meldung angezeigt.

#### Agent-Info (`info`)

- Zeigt: Name, Description, Repository, bekannte Dateien, Status (installiert/nicht installiert).
- Bietet Aktion **Install** oder **Uninstall** als Option (interaktive Liste).
- Standardmäßig ist **Back** ausgewählt.

### 5.4 Skills-Management (Tool: Skills)

Analog zum Agents-Tool. Nutzt `@inquirer/checkbox` für direkte Selektion/Deselektion.

#### Übersicht

- Zeigt **alle** Skills aus allen Repositories in einer einheitlichen Checkbox-Liste.
- Installierte Skills sind **vorausgewählt** (Checkbox aktiv).
- **Leertaste** togglet Aktivierung/Deaktivierung eines Skills.
- **Enter** bestätigt die Auswahl und führt die Änderungen sofort durch.

### 5.5 Wartung (Tools)

#### Doctor

- Gleiche Funktionalität wie der `doctor`-Command.
- Zusätzlich: Wenn ein Agent nicht mehr im Repository enthalten, aber noch lokal installiert ist → Option zum Entfernen.

#### Update

- Nutzt intern den `update`-Command.

#### Cleanup

- Nutzt intern den `cleanup`-Command.

---

## 6 Prompt-Historie (Original)

> Der folgende Abschnitt enthält den ursprünglichen, unbearbeiteten Prompt-Text zur Nachvollziehbarkeit.

<details>
<summary>Original-Prompt aufklappen</summary>

Baue mir ein Node.JS CLI-Tool, dass ich global installieren kann.

Das Tool soll eine Konfigurationsdatei im Home-Verzeichnis unter .agent-control/config.json anlegen.

Das CLI-Tool hat einen Command add-repo (add-repo <url> <name>`), dass die URL zu einem Git-Repository entgegen nimmt und unter .agent-control/repos/<name> hinterlegt. Alternativ kann auch ein lokaler Pfad angegeben werden.

Es gibt zum Command add-repo auch eine interaktive Variante, in der der Benutzer die benötigten Dinge (SSH-URL oder Pfad und den Namen) interkativ gefragt wird.

Beim Hinzufügen eines repos analysiert das CLI-Tool einmal alle .json-Dateien (auch rekursiv), die einen name, eine description und einen prompt haben. Wenn die .json-Datei ein Feld id beinhaltet, wird der Pfad zu der JSON-Datei als identifier benutzt. Dieser identifier (Pfad oder id-Feld) wird zusammen mit dem repository Namen gehasht und als ID genutzt wird. Speichere die letzte Analyse/Update-Zeit des Repositories in den Meta-Informationen ab.

Wenn prompt eine file:// URL zu einer md-Datei ist schaut sich das CLI-Tool auch diese Datei an und sucht nach referenzierten/verlinkten Dateien in der Markdown-Datei (rekursiv, aber so, dass eine Datei nicht doppelt analysiert wird bei einer zirkularen Abhängigkeit).
Die so gefunden Erkenntnisse (einschließlich name und description) speichert das Tool für das Repository in der Datei .agent-control/repos/<name>.meta.json unter dem Property agents.
Die gleiche Analyse wie beim prompt-Feld soll auch für alle angegebenen Pfade im resources-Feld (Array) in der json-Datei durchgeführt werden.
Im resources-Feld kann auch eine URL mit dem Protokoll skill:// stehen. Verändere diese auch entsprechend.
Allerdings müssen hier die Dateien mit absoluten Pfaden referenziert werden.

Es gibt ein Command und ein Tool list-repo mit dem man die Repositories anzeigen lassen kann. Im interaktiven Modus ist es möglich über das Tool auch das add-repo Tool zu öffnen. beim Tool (interkativ) ist es möglich ein Repository auszuwählen um weitere Informationen (Name, Total agents, Installed agents, Git-Support, Letztes Update) zu erhalten und das repository löschen oder aktualisieren zu können. Hebe den aktiven/deaktivierten Git-Support grün oder orange hervor. Interaktive Listen mit Aktionen haben standardmäßig Back ausgewählt.

Es gibt ein Command remove-repo. Dieses wird auch beim löschen eines Repositories im interaktiven Modus verwendet. Wenn es noch installierte/aktive Agents aus dem Repository gibt, lässt sich der Agent nicht entfernen.

Es ist möglich über den Command install <repo> <agent-id> einen Agenten zu "aktivieren". Hierfür wird der Agent (id, repo, name) zum einen in der config.json eingetragen. Außerdem wird die json-Datei nach .agent-control/agents/<agent-id>/<agent-id>.json kopiert. Hier werden die Pfade zu anderen bekannten Dateien angepasst, sodass diese mit ./agent-control_<agent-id>/ geprefixt sind (sollte der ursprüngliche Pfad mit ./ anfangen, darf das ./ nicht doppelt da stehen). Die angepassten Pfade sollen immer mit ./ anfangen. Außerdem wird in dieser Datei das property id entfernt. Alle anderen Dateien werden in `.agent-control/agents/<agent-id>/files kopiert. Die json-Datei, sowie der files Ordner werden als Symlinks in das .kiro/agents Verzeichnis im Home-Verzeichnis abgelegt. Hier liegen sie als agent-control_<agent-id>.json und agent-control_<agent-id>-Ordner-Symlink. Die Symlinks werden alle in der Config-Datei unter dem Attribute symlinks dokumentiert (einschließlich der ids der Agenten die diese Datei brauchen). Wenn der install abbricht (bspw. weil ein Symlink bereits existiert) sollen alle erstellten Symlinks zurück gerollt werden. Die erstellten Symlinks sollen keine Prefix bekommen, sondern genau gleich wie im repo-Verzeichnis abgelegt werden.

Es ist möglich über das Tool install eine interaktive Auswahlliste aller installierbaren Agents aus allen Repositories zu bekommen über die man einen Agenten direkt installieren kann. Es soll in der Liste direkt ersichtlich sein, ob ein Agent bereits installiert ist. Beim Versuch einen Agenten erneut zu installieren, soll ein Fehler angezeigt werden.

Es ist möglich über den Command uninstall <repo> <agent-id> einen Agenten wieder zu "deaktivieren". Dabei sollen die config-Dateien entsprechend angepasst und alle symlinks wieder entfernt werden.

Es ist möglich über das Tool  uninstall eine interaktive Liste der installierten Agents angezeigt zu bekommen über die man einen Agent wieder entfernen kann.

Der Command cleanup entfernt alle erstellten Symlinks, schaut sich alle aktiven Agenten an und erstellt die entsprechenden Symlinks erneut.

Der Command update aktualisiert alle Repositories (falls git repository: git pull), führt die Analyse und anschließend den cleanup command aus. Wenn es uncomittete Änderungen (nur in einem git-Repository) gibt, breche mit einer Fehlermeldung ab. Speicher in den Meta-Daten zu dem Repository ab, wann es zuletzt aktualisiert wurde.

Der Command list-available <repo> soll alle bekannten und analysierten Agents aus dem entsprechenden Repository auflisten.

Das Tool list-available soll alle bekannten und analysierten Agents aus allen  Repositories auflisten. Bei der Auswahl eines Agentens erscheint die gleiche Ausgabe wie bei info <repo> <agent-id>. Einschließlich aller Funktionen. Es soll in der Liste direkt ersichtlich sein, ob ein Agent bereits installiert ist. Es ist möglich in der Liste zu suchen und diese nach Repositories zu filtern. Es muss eine Back-Funktion geben.

Der Command list listet alle aktuell aktiven Agents auf.

Das Tool list listet alle aktuell aktiven Agenten auf. Die Liste ist interaktiv und bei einer Auswahl erhält man das info Tool.

Der Command info <repo> <agent-id> soll detaillierte Informationen (name, description, repo, bekannte Dateien) zu einem Agenten zurück geben. Außerdem soll der aktuelle Status (installiert, nicht installiert) wiedergeben.

Das Tool info gibt die gleichen Informationen, wie das Command info, sowie eine Option "Install" oder "Uninstall" aus. Dies soll keine Abfrage sein, sondern einfach eine Option (interaktive Liste). Als Aktion ist standardmäßig back ausgewählt.

Das Tool doctor soll dabei helfen fehlerhafte Stände automatisch zu beheben. Hierzu zählen Fehler mit den Git-Repositories, Fehlerhafte Symlinks und fehlerhafte oder inkonsistente Config-Dateien. Der doctor soll auch auf Fehler hinweisen, wenn ein Agent nicht mehr im Repository enthalten, aber noch lokal installiert ist. Im interaktiven Modus soll es die Option geben diesen Agent dann zu entfernen. Strukturiere den doctor Command so, dass du jedes Problem in einer eigenen Funktion/Datei analysieren kannst. Diese kannst du unter utils in einem doctor-Ordner ablegen.

Es gibt eine vollständig interaktive Version des Tools, wenn man einfach agent-control ausführt. Hier kann man die Repos verwalten (ansehen, hinzufügen, löschen), die repos updaten, einen cleanup ausführen, verfügbare und installierte Agenten anzeigen lassen und über die liste an verfügbaren Agenten neue Agenten installieren. Die Reihenfolge im Hauptmenü ist: Update, Browse Available, Manage installed Agents, Manage repositories, Doctor, Cleanup. Füge ein paar schöne Icons vor dem Text (mit Space getrennt) hinzu.

Die Back Option in Interaktiven Listen sollte immer einen zurück Pfeil vor dem Text haben um sie von den anderen Listenelementen abzuheben.

Immer, wenn du einen Agenten anzeigst (list, interactive install/uninstall), zeige auch an, aus welchem Repository dieser kommt. Vielleicht kannst du hierfür das Repository voranschreiben und farblich hinterlegen. Füge hinter dem Repository-Namen (in der farblich hinterlegten Box) einen grünen Punkt für Repositories mit Git-Support und einen orangen Punkt für alle anderen hinzu.

Ein Command ist ein nach außen per CLI angebotene Kommando unter der Anwendung <anwendungs-name> <command-name>, während ein Tool eine intern (per interaktivem Modus) angebotene Funktion ist.

Baue das Ganze Projekt bitte möglich schön (mehrere Dateien, Typescript) auf. Am besten auch mit utility-Funktionen (falls notwendig). Alle Commands sollten in eigenen Dateien stehen. Wenn du utils clustern kannst (bspw. filesystem, config, etc.) dann packe sie in einzelne Dateien in einem utils Ordner. Dupliziere für "gleiche Ansichten" keine Code, sondern lagere ihn in eigene Dateien aus. Tools und Commands liegen in eigenen Ordnern.

Füge Unit-Tests zu der gesamten Codebase hinzu. Nutze als Test-Framework vitest.

</details>
