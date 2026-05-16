import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Folder, FolderPlus, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { toggleBookmark, getQFTokens } from '../lib/firestore';
import { API_BASE, addToQFCollection } from '../services/api';
import { RADIUS, SHADOW } from '../theme';

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

export default function BookmarkCollectionModal({
  uid, verseKey, surahName, arabic, translation, onClose, onSaved,
}: Props) {
  const { colors } = useTheme();
  const [collections, setCollections] = useState<QFCollection[]>([]);
  const [selectedId, setSelectedId] = useState<string>('default');
  const [mode, setMode] = useState<'pick' | 'new'>('pick');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [qfToken, setQfToken] = useState<string | null>(null);

  useEffect(() => {
    getQFTokens(uid).then((tokens) => {
      if (!tokens?.accessToken || tokens.expiresAt < Date.now()) return;
      setQfToken(tokens.accessToken);
      fetch(`${API_BASE}/api/qf/collections`, {
        headers: { 'x-qf-token': tokens.accessToken },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (Array.isArray(data?.data)) {
            setCollections(data.data.filter((c: QFCollection) => c.id && c.name));
          }
        })
        .catch(() => {});
    }).catch(() => {});
  }, [uid]);

  async function handleSave() {
    setSaving(true);
    try {
      let collectionName: string | undefined;
      let qfCollectionId: string | undefined;

      if (mode === 'new' && newName.trim()) {
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
      } else if (mode === 'pick' && selectedId !== 'default') {
        const col = collections.find((c) => c.id === selectedId);
        collectionName = col?.name;
        qfCollectionId = selectedId;
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
      paddingBottom: 36,
      ...SHADOW.strong,
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 12, color: colors.textMuted, marginBottom: 16 },
    sectionLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    option: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 14, borderRadius: RADIUS.md, borderWidth: 1,
      borderColor: colors.cardBorder, marginBottom: 8,
    },
    optionActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
    optionLabel: { fontSize: 14, fontWeight: '500', color: colors.textMuted, flex: 1 },
    optionLabelActive: { color: colors.text },
    input: {
      borderWidth: 1, borderColor: colors.cardBorder, borderRadius: RADIUS.md,
      padding: 12, fontSize: 14, color: colors.text,
      backgroundColor: colors.card,
      marginBottom: 8,
    },
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: RADIUS.md,
      padding: 14, alignItems: 'center', marginTop: 8,
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  }), [colors]);

  const items: Array<{ id: string; label: string; isNew?: boolean }> = [
    { id: 'default', label: 'Default' },
    ...collections.map((c) => ({ id: c.id, label: c.name })),
    { id: '__new__', label: 'New collection…', isNew: true },
  ];

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Save Bookmark</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>{surahName} · {verseKey}</Text>

          <Text style={styles.sectionLabel}>Add to collection</Text>
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const isActive = item.isNew ? mode === 'new' : mode === 'pick' && selectedId === item.id;
              return (
                <Pressable
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => {
                    if (item.isNew) { setMode('new'); }
                    else { setMode('pick'); setSelectedId(item.id); }
                  }}
                >
                  {item.isNew
                    ? <FolderPlus size={16} color={isActive ? colors.primary : colors.textMuted} />
                    : <Folder size={16} color={isActive ? colors.primary : colors.textMuted} />}
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />

          {mode === 'new' && (
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
            style={[styles.saveBtn, (saving || (mode === 'new' && !newName.trim())) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving || (mode === 'new' && !newName.trim())}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Save Bookmark</Text>}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
