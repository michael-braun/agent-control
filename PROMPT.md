Baue mir ein Node.JS CLI-Tool, dass ich global installieren kann.

Das Tool soll eine Konfigurationsdatei im Home-Verzeichnis unter .agent-control/config.json anlegen.

Das CLI-Tool hat einen Command add-repo (add-repo <url> <name>`), dass die URL zu einem Git-Repository entgegen nimmt und unter .agent-control/repos/<name> hinterlegt. Alternativ kann auch ein lokaler Pfad angegeben werden.

Es gibt zum Command add-repo auch eine interaktive Variante, in der der Benutzer die benötigten Dinge (SSH-URL oder Pfad und den Namen) interkativ gefragt wird.

Beim Hinzufügen eines repos analysiert das CLI-Tool einmal alle .json-Dateien (auch rekursiv), die einen name, eine description und einen prompt haben. Wenn die .json-Datei ein Feld id beinhaltet, wird der Pfad zu der JSON-Datei als identifier benutzt. Dieser identifier (Pfad oder id-Feld) wird zusammen mit dem repository Namen gehasht und als ID genutzt wird. Speichere die letzte Analyse/Update-Zeit des Repositories in den Meta-Informationen ab.

Wenn prompt eine file:// URL zu einer md-Datei ist schaut sich das CLI-Tool auch diese Datei an und sucht nach referenzierten/verlinkten Dateien in der Markdown-Datei (rekursiv, aber so, dass eine Datei nicht doppelt analysiert wird bei einer zirkularen Abhängigkeit). Die so gefunden Erkenntnisse (einschließlich name und description) speichert das Tool für das Repository in der Datei .agent-control/repos/<name>.meta.json unter dem Property agents. Die gleiche Analyse wie beim prompt-Feld soll auch für alle angegebenen Pfade im resources-Feld (Array) in der json-Datei durchgeführt werden.

Es gibt ein Command und ein Tool list-repo mit dem man die Repositories anzeigen lassen kann. Im interaktiven Modus ist es möglich über das Tool auch das add-repo Tool zu öffnen. beim Tool (interkativ) ist es möglich ein Repository auszuwählen um weitere Informationen (Name, Total agents, Installed agents, Git-Support, Letztes Update) zu erhalten und das repository löschen oder aktualisieren zu können. Hebe den aktiven/deaktivierten Git-Support grün oder orange hervor. Interaktive Listen mit Aktionen haben standardmäßig Back ausgewählt.

Es gibt ein Command remove-repo. Dieses wird auch beim löschen eines Repositories im interaktiven Modus verwendet. Wenn es noch installierte/aktive Agents aus dem Repository gibt, lässt sich der Agent nicht entfernen.

Es ist möglich über den Command install <repo> <agent-id> einen Agenten zu “aktivieren”. Hierfür wird der Agent (id, repo, name) zum einen in der config.json eingetragen. Außerdem wird die json-Datei nach .agent-control/agents/<agent-id>/<agent-id>.json kopiert. Hier werden die Pfade zu anderen bekannten Dateien angepasst, sodass diese mit ./agent-control_<agent-id>/ geprefixt sind (sollte der ursprüngliche Pfad mit ./ anfangen, darf das ./ nicht doppelt da stehen). Die angepassten Pfade sollen immer mit ./ anfangen. Außerdem wird in dieser Datei das property id entfernt. Alle anderen Dateien werden in `.agent-control/agents/<agent-id>/files kopiert. Die json-Datei, sowie der files Ordner werden als Symlinks in das .kiro/agents Verzeichnis im Home-Verzeichnis abgelegt. Hier liegen sie als agent-control_<agent-id>.json und agent-control_<agent-id>-Ordner-Symlink. Die Symlinks werden alle in der Config-Datei unter dem Attribute symlinks dokumentiert (einschließlich der ids der Agenten die diese Datei brauchen). Wenn der install abbricht (bspw. weil ein Symlink bereits existiert) sollen alle erstellten Symlinks zurück gerollt werden. Die erstellten Symlinks sollen keine Prefix bekommen, sondern genau gleich wie im repo-Verzeichnis abgelegt werden.

Es ist möglich über das Tool install eine interaktive Auswahlliste aller installierbaren Agents aus allen Repositories zu bekommen über die man einen Agenten direkt installieren kann. Es soll in der Liste direkt ersichtlich sein, ob ein Agent bereits installiert ist. Beim Versuch einen Agenten erneut zu installieren, soll ein Fehler angezeigt werden.

Es ist möglich über den Command uninstall <repo> <agent-id> einen Agenten wieder zu “deaktivieren“. Dabei sollen die config-Dateien entsprechend angepasst und alle symlinks wieder entfernt werden.

Es ist möglich über das Tool  uninstall eine interaktive Liste der installierten Agents angezeigt zu bekommen über die man einen Agent wieder entfernen kann.

Der Command cleanup entfernt alle erstellten Symlinks, schaut sich alle aktiven Agenten an und erstellt die entsprechenden Symlinks erneut.

Der Command update aktualisiert alle Repositories (falls git repository: git pull), führt die Analyse und anschließend den cleanup command aus. Wenn es uncomittete Änderungen (nur in einem git-Repository) gibt, breche mit einer Fehlermeldung ab. Speicher in den Meta-Daten zu dem Repository ab, wann es zuletzt aktualisiert wurde.

Der Command list-available <repo> soll alle bekannten und analysierten Agents aus dem entsprechenden Repository auflisten.

Das Tool list-available soll alle bekannten und analysierten Agents aus allen  Repositories auflisten. Bei der Auswahl eines Agentens erscheint die gleiche Ausgabe wie bei info <repo> <agent-id>. Einschließlich aller Funktionen. Es soll in der Liste direkt ersichtlich sein, ob ein Agent bereits installiert ist. Es ist möglich in der Liste zu suchen und diese nach Repositories zu filtern. Es muss eine Back-Funktion geben.

Der Command list listet alle aktuell aktiven Agents auf.

Das Tool list listet alle aktuell aktiven Agenten auf. Die Liste ist interaktiv und bei einer Auswahl erhält man das info Tool.

Der Command info <repo> <agent-id> soll detaillierte Informationen (name, description, repo, bekannte Dateien) zu einem Agenten zurück geben. Außerdem soll der aktuelle Status (installiert, nicht installiert) wiedergeben.

Das Tool info gibt die gleichen Informationen, wie das Command info, sowie eine Option “Install“ oder “Uninstall“ aus. Dies soll keine Abfrage sein, sondern einfach eine Option (interaktive Liste). Als Aktion ist standardmäßig back ausgewählt.

Das Tool doctor soll dabei helfen fehlerhafte Stände automatisch zu beheben. Hierzu zählen Fehler mit den Git-Repositories, Fehlerhafte Symlinks und fehlerhafte oder inkonsistente Config-Dateien. Der doctor soll auch auf Fehler hinweisen, wenn ein Agent nicht mehr im Repository enthalten, aber noch lokal installiert ist. Im interaktiven Modus soll es die Option geben diesen Agent dann zu entfernen. Strukturiere den doctor Command so, dass du jedes Problem in einer eigenen Funktion/Datei analysieren kannst. Diese kannst du unter utils in einem doctor-Ordner ablegen.

Es gibt eine vollständig interaktive Version des Tools, wenn man einfach agent-control ausführt. Hier kann man die Repos verwalten (ansehen, hinzufügen, löschen), die repos updaten, einen cleanup ausführen, verfügbare und installierte Agenten anzeigen lassen und über die liste an verfügbaren Agenten neue Agenten installieren. Die Reihenfolge im Hauptmenü ist: Update, Browse Available, Manage installed Agents, Manage repositories, Doctor, Cleanup. Füge ein paar schöne Icons vor dem Text (mit Space getrennt) hinzu.

Die Back Option in Interaktiven Listen sollte immer einen zurück Pfeil vor dem Text haben um sie von den anderen Listenelementen abzuheben.

Immer, wenn du einen Agenten anzeigst (list, interactive install/uninstall), zeige auch an, aus welchem Repository dieser kommt. Vielleicht kannst du hierfür das Repository voranschreiben und farblich hinterlegen. Füge hinter dem Repository-Namen (in der farblich hinterlegten Box) einen grünen Punkt für Repositories mit Git-Support und einen orangen Punkt für alle anderen hinzu.

Ein Command ist ein nach außen per CLI angebotene Kommando unter der Anwendung <anwendungs-name> <command-name>, während ein Tool eine intern (per interaktivem Modus) angebotene Funktion ist.

Baue das Ganze Projekt bitte möglich schön (mehrere Dateien, Typescript) auf. Am besten auch mit utility-Funktionen (falls notwendig). Alle Commands sollten in eigenen Dateien stehen. Wenn du utils clustern kannst (bspw. filesystem, config, etc.) dann packe sie in einzelne Dateien in einem utils Ordner. Dupliziere für “gleiche Ansichten“ keine Code, sondern lagere ihn in eigene Dateien aus. Tools und Commands liegen in eigenen Ordnern.