import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Check, ChevronDown, Folder, FolderPlus, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { triggerHaptic } from '../lib/haptics';
import { toggleBookmark, getQFTokens, getBookmarks } from '../lib/firestore';
import { API_BASE, addToQFCollection } from '../services/api';
import { DEPTH, RADIUS, SHADOW } from '../theme';

interface QFCollection { id: string; name: string }

interface Props {
  uid: string;
  verseKey: string;
  surahName: string;
  arabic: string;
  translation: string;
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT_ID = '__default__';
const NEW_ID = '__new__';
const LOCAL_PREFIX = '__local__:';

export default function BookmarkCollectionModal({
  uid, verseKey, surahName, arabic, translation, onClose, onSaved,
}: Props) {
  const { colors, hapticsEnabled } = useTheme();
  const [qfCollections, setQfCollections] = useState<QFCollection[]>([]);
  const [localCollectionNames, setLocalCollectionNames] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState(DEFAULT_ID);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [qfToken, setQfToken] = useState<string | null>(null);
  const [savePressed, setSavePressed] = useState(false);

  useEffect(() => {
    // Always load local collection names from existing bookmarks
    getBookmarks(uid).then((bms) => {
      const names = Array.from(
        new Set(bms.map((b) => b.collectionName).filter(Boolean) as string[])
      );
      setLocalCollectionNames(names);
    }).catch(() => {});

    // Also load QF collections if token is valid
    getQFTokens(uid).then((tokens) => {
      if (!tokens?.accessToken) return;
      if (tokens.expiresAt && tokens.expiresAt < Date.now()) return;
      setQfToken(tokens.accessToken);
      fetch(`${API_BASE}/api/qf/collections`, {
        headers: { 'x-qf-token': tokens.accessToken },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (Array.isArray(data?.data)) {
            setQfCollections(data.data.filter((c: QFCollection) => c.id && c.name));
          }
        })
        .catch(() => {});
    }).catch(() => {});
  }, [uid]);

  // Merge local and QF collections by name, QF takes precedence (has an id for sync)
  const mergedCollections = useMemo(() => {
    const byName = new Map<string, string | null>();
    localCollectionNames.forEach((name) => byName.set(name, null));
    qfCollections.forEach((c) => byName.set(c.name, c.id));
    return Array.from(byName.entries()).map(([name, qfId]) => ({
      id: qfId ?? `${LOCAL_PREFIX}${name}`,
      label: name,
      qfId,
    }));
  }, [localCollectionNames, qfCollections]);

  const allOptions = [
    { id: DEFAULT_ID, label: 'Default' },
    ...mergedCollections.map((c) => ({ id: c.id, label: c.label })),
    { id: NEW_ID, label: 'New collection…' },
  ];

  const selectedLabel = allOptions.find((o) => o.id === selectedId)?.label ?? 'Default';
  const isNew = selectedId === NEW_ID;

  async function handleSave() {
    if (isNew && !newName.trim()) return;
    setSaving(true);
    try {
      let collectionName: string | undefined;
      let qfCollectionId: string | undefined;

      if (isNew && newName.trim()) {
        collectionName = newName.trim();
        if (qfToken) {
          const res = await fetch(`${API_BASE}/api/qf/collections`, {
            method: 'POST',
            headers: { 'x-qf-token': qfToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: collectionName }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);
          if (res?.data?.id) qfCollectionId = String(res.data.id);
        }
      } else if (selectedId !== DEFAULT_ID) {
        if (selectedId.startsWith(LOCAL_PREFIX)) {
          // Local-only collection (no QF id yet)
          collectionName = selectedId.slice(LOCAL_PREFIX.length);
          const matchingQF = qfCollections.find((c) => c.name === collectionName);
          qfCollectionId = matchingQF?.id;
        } else {
          const col = mergedCollections.find((c) => c.id === selectedId);
          collectionName = col?.label;
          qfCollectionId = selectedId;
        }
      }

      await toggleBookmark(uid, { verseKey, surahName, arabic, translation, collectionName });

      if (qfToken) {
        const [chStr, vStr] = verseKey.split(':');
        addToQFCollection(
          qfToken,
          parseInt(chStr, 10),
          parseInt(vStr, 10),
          qfCollectionId,
        ).catch(() => {});
      }

      triggerHaptic(hapticsEnabled, 'light');
      onSaved();
      onClose();
    } catch {
      // keep modal open
    } finally {
      setSaving(false);
    }
  }

  const styles = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      padding: 24,
      paddingBottom: 40,
      ...SHADOW.strong,
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 12, color: colors.textMuted, marginBottom: 20 },
    label: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },

    // Dropdown trigger
    trigger: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 14, borderRadius: RADIUS.md, borderWidth: 1.5,
      borderColor: colors.primary, backgroundColor: `${colors.primary}15`,
      marginBottom: 8,
    },
    triggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    triggerLabel: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },

    // Dropdown list
    dropdown: {
      borderRadius: RADIUS.md, borderWidth: 1,
      borderColor: colors.cardBorder, backgroundColor: colors.card,
      marginBottom: 8, overflow: 'hidden',
      ...SHADOW.card,
    },
    option: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 14, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
    },
    optionLast: { borderBottomWidth: 0 },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    optionLabel: { fontSize: 14, color: colors.textMuted, flex: 1 },
    optionLabelActive: { color: colors.text, fontWeight: '600' },

    input: {
      borderWidth: 1, borderColor: colors.cardBorder, borderRadius: RADIUS.md,
      padding: 13, fontSize: 14, color: colors.text,
      backgroundColor: colors.card, marginBottom: 8,
    },
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: RADIUS.md,
      padding: 15, alignItems: 'center', marginTop: 4,
      ...DEPTH.button,
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  }), [colors]);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.sheet}>

          <View style={styles.header}>
            <Text style={styles.title}>Save Bookmark</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>{surahName} · {verseKey}</Text>

          <Text style={styles.label}>Add to collection</Text>

          {/* Dropdown trigger */}
          <Pressable style={styles.trigger} onPress={() => setDropdownOpen((v) => !v)}>
            <View style={styles.triggerLeft}>
              {isNew
                ? <FolderPlus size={16} color={colors.primary} />
                : <Folder size={16} color={colors.primary} />}
              <Text style={styles.triggerLabel} numberOfLines={1}>{selectedLabel}</Text>
            </View>
            <ChevronDown
              size={16}
              color={colors.textMuted}
              style={{ transform: [{ rotate: dropdownOpen ? '180deg' : '0deg' }] }}
            />
          </Pressable>

          {/* Dropdown options */}
          {dropdownOpen && (
            <ScrollView style={styles.dropdown} scrollEnabled={allOptions.length > 5} nestedScrollEnabled>
              {allOptions.map((opt, idx) => {
                const active = opt.id === selectedId;
                const isLast = idx === allOptions.length - 1;
                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.option, isLast && styles.optionLast]}
                    onPress={() => {
                      setSelectedId(opt.id);
                      setDropdownOpen(false);
                      if (opt.id !== NEW_ID) setNewName('');
                    }}
                  >
                    <View style={styles.optionLeft}>
                      {opt.id === NEW_ID
                        ? <FolderPlus size={15} color={active ? colors.primary : colors.textMuted} />
                        : <Folder size={15} color={active ? colors.primary : colors.textMuted} />}
                      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
                    </View>
                    {active && <Check size={15} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* New collection name input */}
          {isNew && (
            <TextInput
              autoFocus
              value={newName}
              onChangeText={setNewName}
              placeholder="Collection name"
              placeholderTextColor={colors.textMuted}
              maxLength={64}
              style={styles.input}
            />
          )}

          <Pressable
            style={[styles.saveBtn, (saving || (isNew && !newName.trim())) && styles.saveBtnDisabled, savePressed && DEPTH.buttonPressed]}
            onPress={handleSave}
            onPressIn={() => setSavePressed(true)}
            onPressOut={() => setSavePressed(false)}
            disabled={saving || (isNew && !newName.trim())}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Save Bookmark</Text>}
          </Pressable>

        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
