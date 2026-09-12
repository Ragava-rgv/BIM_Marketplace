import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CategoryGroupDto, CategoryDto, CategorySpecTemplateDto, SubcategoryDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  PageHeading,
  Select,
  SuccessBanner,
  Textarea,
} from '../../components/ui';
import { PlusIcon, TrashIcon, ChevronRightIcon, UploadIcon } from '../../components/icons';

const FIELD_TYPES = ['number', 'text', 'select', 'boolean'] as const;
const FILTER_TYPES = ['none', 'range', 'exact'] as const;

type SpecFieldType = (typeof FIELD_TYPES)[number];
type SpecFilterType = (typeof FILTER_TYPES)[number];

interface NewSpecFieldValues {
  subcategoryId: string;
  fieldKey: string;
  fieldLabel: string;
  unit: string;
  fieldType: SpecFieldType;
  options: string;
  isRequired: boolean;
  isFilterable: boolean;
  filterType: SpecFilterType;
  helpText: string;
}

const EMPTY_FIELD: NewSpecFieldValues = {
  subcategoryId: '', fieldKey: '', fieldLabel: '', unit: '', fieldType: 'text',
  options: '', isRequired: false, isFilterable: false, filterType: 'none', helpText: '',
};

interface NewCategoryValues {
  name: string; slug: string; description: string; groupId: string; iconKey: string;
}

const EMPTY_CAT: NewCategoryValues = { name: '', slug: '', description: '', groupId: '', iconKey: '' };

interface NewSubcategoryValues {
  name: string; slug: string; description: string; iconKey: string;
}

const EMPTY_SUB: NewSubcategoryValues = { name: '', slug: '', description: '', iconKey: '' };

type AdminCategory = CategoryDto & {
  group?: CategoryGroupDto | null;
  specFields?: CategorySpecTemplateDto[];
  subcategories?: SubcategoryDto[];
  _count?: { listings: number };
};

export function AdminCatalogManager() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<CategoryGroupDto[]>([]);
  const [allCats, setAllCats] = useState<AdminCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);

  const [showCatForm, setShowCatForm] = useState(false);
  const [newCat, setNewCat] = useState<NewCategoryValues>(EMPTY_CAT);
  const [addingCat, setAddingCat] = useState(false);

  const [showFieldForm, setShowFieldForm] = useState(false);
  const [newField, setNewField] = useState<NewSpecFieldValues>(EMPTY_FIELD);
  const [addingField, setAddingField] = useState(false);

  const [showSubForm, setShowSubForm] = useState(false);
  const [newSub, setNewSub] = useState<NewSubcategoryValues>(EMPTY_SUB);
  const [addingSub, setAddingSub] = useState(false);

  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  const [uploadingCatImage, setUploadingCatImage] = useState(false);
  const [uploadingSubImageId, setUploadingSubImageId] = useState<string | null>(null);

  const catImageRef = useRef<HTMLInputElement>(null);
  const subImageRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    const [groupsRes, catsRes] = await Promise.all([
      api.get<CategoryGroupDto[]>('/admin/catalog/groups'),
      api.get<AdminCategory[]>('/admin/catalog/categories'),
    ]);
    setGroups(groupsRes.data);
    setAllCats(catsRes.data);
  };

  useEffect(() => {
    load().catch(() => setError(t('admin.catalogManager.loadError'))).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  // ── Group actions ─────────────────────────────────────────────

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setAddingGroup(true);
    setError(null);
    try {
      await api.post('/admin/catalog/groups', { name: newGroupName.trim() });
      setNewGroupName('');
      await load();
      flash(t('admin.catalogManager.groupCreated'));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.groupCreateError')));
    } finally { setAddingGroup(false); }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(t('admin.catalogManager.deleteGroupConfirm', { name }))) return;
    setError(null);
    try {
      await api.delete(`/admin/catalog/groups/${id}`);
      await load();
      flash(t('admin.catalogManager.groupDeleted'));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.groupDeleteError')));
    }
  };

  // ── Category actions ─────────────────────────────────────────────

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCat(true);
    setError(null);
    try {
      await api.post('/admin/catalog/categories', {
        name: newCat.name.trim(),
        slug: newCat.slug.trim(),
        description: newCat.description.trim() || undefined,
        groupId: newCat.groupId || undefined,
        iconKey: newCat.iconKey.trim() || undefined,
      });
      setNewCat(EMPTY_CAT);
      setShowCatForm(false);
      await load();
      flash(t('admin.catalogManager.categoryCreated'));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.categoryCreateError')));
    } finally { setAddingCat(false); }
  };

  const handleToggleCatActive = async (cat: AdminCategory) => {
    setError(null);
    try {
      if (cat.isActive) {
        await api.patch(`/admin/catalog/categories/${cat.id}/deactivate`);
      } else {
        await api.patch(`/admin/catalog/categories/${cat.id}`, { isActive: true });
      }
      await load();
      flash(cat.isActive
        ? t('admin.catalogManager.itemDeactivated', { name: cat.name })
        : t('admin.catalogManager.itemActivated', { name: cat.name }));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.categoryUpdateError')));
    }
  };

  const handleDeleteCategory = async (cat: AdminCategory) => {
    const listingCount = cat._count?.listings ?? 0;
    if (listingCount > 0) {
      alert(t('admin.catalogManager.cannotDeleteCategory', { count: listingCount }));
      return;
    }
    const subCount = cat.subcategories?.length ?? 0;
    const msg = subCount > 0
      ? t('admin.catalogManager.deleteCategoryWithSubsConfirm', { name: cat.name, count: subCount })
      : t('admin.catalogManager.deleteCategoryConfirm', { name: cat.name });
    if (!confirm(msg)) return;
    setDeletingCatId(cat.id);
    setError(null);
    try {
      await api.delete(`/admin/catalog/categories/${cat.id}`);
      if (selectedCatId === cat.id) setSelectedCatId(null);
      await load();
      flash(t('admin.catalogManager.categoryDeleted'));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.categoryDeleteError')));
    } finally { setDeletingCatId(null); }
  };

  const handleUploadCategoryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCatId || !e.target.files?.[0]) return;
    setUploadingCatImage(true);
    setError(null);
    const fd = new FormData();
    fd.append('image', e.target.files[0]);
    try {
      await api.post(`/admin/catalog/categories/${selectedCatId}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
      flash(t('admin.catalogManager.categoryImageUpdated'));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.imageUploadError')));
    } finally { setUploadingCatImage(false); }
  };

  // ── Subcategory actions ─────────────────────────────────────────────

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) return;
    setAddingSub(true);
    setError(null);
    try {
      await api.post('/admin/catalog/subcategories', {
        categoryId: selectedCatId,
        name: newSub.name.trim(),
        slug: newSub.slug.trim(),
        description: newSub.description.trim() || undefined,
        iconKey: newSub.iconKey.trim() || undefined,
      });
      setNewSub(EMPTY_SUB);
      setShowSubForm(false);
      await load();
      flash(t('admin.catalogManager.subcategoryAdded'));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.subcategoryAddError')));
    } finally { setAddingSub(false); }
  };

  const handleToggleSubActive = async (sub: SubcategoryDto) => {
    setError(null);
    try {
      if (sub.isActive) {
        await api.patch(`/admin/catalog/subcategories/${sub.id}/deactivate`);
      } else {
        await api.patch(`/admin/catalog/subcategories/${sub.id}`, { isActive: true });
      }
      await load();
      flash(sub.isActive
        ? t('admin.catalogManager.itemDeactivated', { name: sub.name })
        : t('admin.catalogManager.itemActivated', { name: sub.name }));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.subcategoryUpdateError')));
    }
  };

  const handleDeleteSubcategory = async (sub: SubcategoryDto) => {
    if (!confirm(t('admin.catalogManager.deleteSubcategoryConfirm', { name: sub.name }))) return;
    setDeletingSubId(sub.id);
    setError(null);
    try {
      await api.delete(`/admin/catalog/subcategories/${sub.id}`);
      await load();
      flash(t('admin.catalogManager.subcategoryDeleted'));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.subcategoryDeleteError')));
    } finally { setDeletingSubId(null); }
  };

  const handleUploadSubImage = async (sub: SubcategoryDto, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingSubImageId(sub.id);
    setError(null);
    const fd = new FormData();
    fd.append('image', e.target.files[0]);
    try {
      await api.post(`/admin/catalog/subcategories/${sub.id}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
      flash(t('admin.catalogManager.subImageUpdated', { name: sub.name }));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.imageUploadError')));
    } finally { setUploadingSubImageId(null); }
  };

  // ── Spec field actions ─────────────────────────────────────────────

  const handleAddSpecField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) return;
    setAddingField(true);
    setError(null);
    try {
      await api.post(`/admin/catalog/categories/${selectedCatId}/spec-fields`, {
        subcategoryId: newField.subcategoryId || undefined,
        fieldKey: newField.fieldKey.trim(),
        fieldLabel: newField.fieldLabel.trim(),
        unit: newField.unit.trim() || undefined,
        fieldType: newField.fieldType,
        options: newField.fieldType === 'select'
          ? newField.options.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        isRequired: newField.isRequired,
        isFilterable: newField.isFilterable,
        filterType: newField.filterType,
        helpText: newField.helpText.trim() || undefined,
      });
      setNewField(EMPTY_FIELD);
      setShowFieldForm(false);
      await load();
      flash(t('admin.catalogManager.specFieldAdded'));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.specFieldAddError')));
    } finally { setAddingField(false); }
  };

  const handleDeleteSpecField = async (fieldId: string, label: string) => {
    if (!confirm(t('admin.catalogManager.deleteSpecFieldConfirm', { label }))) return;
    setDeletingFieldId(fieldId);
    setError(null);
    try {
      await api.delete(`/admin/catalog/spec-fields/${fieldId}`);
      await load();
      flash(t('admin.catalogManager.specFieldRemoved'));
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.catalogManager.specFieldDeleteError')));
    } finally { setDeletingFieldId(null); }
  };

  // ── Render ─────────────────────────────────────────────

  const selectedCat = allCats.find((c) => c.id === selectedCatId) ?? null;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-navy/5" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow={t('admin.catalogManager.eyebrow')}
        title={t('admin.catalogManager.title')}
        description={t('admin.catalogManager.description')}
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {success && <div className="mb-5"><SuccessBanner message={success} /></div>}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">

        {/* ── Left panel ───────────────────────────────────── */}
        <div className="space-y-5">
          {/* Groups */}
          <Card>
            <h2 className="mb-3 text-sm font-bold text-ink">{t('admin.catalogManager.categoryGroups')}</h2>
            <form onSubmit={(e) => void handleAddGroup(e)} className="flex gap-2">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={t('admin.catalogManager.newGroupPlaceholder')}
                className="flex-1"
              />
              <Button type="submit" disabled={addingGroup || !newGroupName.trim()}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </form>
            <ul className="mt-3 space-y-1.5">
              {groups.map((g) => (
                <li key={g.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{g.name}</span>
                  <button
                    onClick={() => void handleDeleteGroup(g.id, g.name)}
                    className="text-red-500 hover:text-red-700 transition"
                    title={t('admin.catalogManager.deleteGroupTitle')}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Category list */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">
                {t('admin.catalogManager.categories')} <span className="font-mono text-[11px] text-muted">({allCats.length})</span>
              </h2>
              <Button variant="ghost" onClick={() => setShowCatForm((v) => !v)} className="!px-2.5 !py-1 text-xs">
                {showCatForm ? t('common:common.button.cancel') : t('admin.catalogManager.newShort')}
              </Button>
            </div>

            {showCatForm && (
              <form onSubmit={(e) => void handleAddCategory(e)} className="mb-4 space-y-3 rounded-lg border border-line bg-navy/[.02] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted">{t('admin.catalogManager.newCategory')}</h3>
                <Field label={t('admin.catalogManager.fields.name')}>
                  <Input
                    value={newCat.name}
                    onChange={(e) => setNewCat((v) => ({
                      ...v,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                    }))}
                    placeholder="Press Brake"
                    required
                  />
                </Field>
                <Field label={t('admin.catalogManager.fields.slug')} hint={t('admin.catalogManager.fields.slugHint')}>
                  <Input value={newCat.slug} onChange={(e) => setNewCat((v) => ({ ...v, slug: e.target.value }))} placeholder="press-brake" required />
                </Field>
                <Field label={t('admin.catalogManager.fields.group')}>
                  <Select value={newCat.groupId} onChange={(e) => setNewCat((v) => ({ ...v, groupId: e.target.value }))}>
                    <option value="">{t('admin.catalogManager.noGroup')}</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </Select>
                </Field>
                <Field label={t('admin.catalogManager.fields.description')}>
                  <Textarea rows={2} value={newCat.description} onChange={(e) => setNewCat((v) => ({ ...v, description: e.target.value }))} />
                </Field>
                <Button type="submit" disabled={addingCat || !newCat.name.trim() || !newCat.slug.trim()}>
                  {addingCat ? t('admin.catalogManager.adding') : t('admin.catalogManager.addCategory')}
                </Button>
              </form>
            )}

            <ul className="space-y-1">
              {allCats.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      setSelectedCatId(cat.id === selectedCatId ? null : cat.id);
                      setShowSubForm(false);
                      setShowFieldForm(false);
                    }}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      cat.id === selectedCatId
                        ? 'bg-forest text-white'
                        : 'hover:bg-navy/[.04] text-ink'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{cat.name}</p>
                      <p className={`text-[11px] ${cat.id === selectedCatId ? 'text-white/65' : 'text-muted'}`}>
                        {cat.group?.name ?? t('admin.catalogManager.noGroup')}
                        {' · '}
                        {t('admin.catalogManager.listingsCount', { count: cat._count?.listings ?? 0 })}
                        {' · '}
                        {t('admin.catalogManager.subcatsCount', { count: cat.subcategories?.length ?? 0 })}
                        {!cat.isActive && ` · ${t('admin.catalogManager.inactive')}`}
                      </p>
                    </div>
                    <ChevronRightIcon className={`h-3.5 w-3.5 flex-shrink-0 ${cat.id === selectedCatId ? 'text-white/70' : 'text-muted group-hover:text-ink'}`} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* ── Right panel ───────────────────────────────────── */}
        {selectedCat ? (
          <div className="space-y-5">

            {/* Category header + controls */}
            <Card>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink">{selectedCat.name}</h2>
                  {selectedCat.description && (
                    <p className="mt-0.5 text-sm text-muted">{selectedCat.description}</p>
                  )}
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {t('admin.catalogManager.slugLabel')}: {selectedCat.slug}
                    {' · '}
                    <span className="text-copper font-semibold">{t('admin.catalogManager.listingsCount', { count: selectedCat._count?.listings ?? 0 })}</span>
                    {' · '}
                    {t('admin.catalogManager.subcategoriesCount', { count: selectedCat.subcategories?.length ?? 0 })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => void handleToggleCatActive(selectedCat)}
                    className="!py-1.5 text-xs"
                  >
                    {selectedCat.isActive ? t('admin.catalogManager.deactivate') : t('admin.catalogManager.activate')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void handleDeleteCategory(selectedCat)}
                    disabled={deletingCatId === selectedCat.id}
                    className="!py-1.5 text-xs"
                  >
                    {deletingCatId === selectedCat.id ? t('admin.catalogManager.deleting') : t('common:common.button.delete')}
                  </Button>
                </div>
              </div>

              {/* Category image */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">{t('admin.catalogManager.categoryImage')}</p>
                <div className="flex items-center gap-4">
                  {selectedCat.imageUrl ? (
                    <img
                      src={selectedCat.imageUrl}
                      alt={selectedCat.name}
                      className="h-16 w-24 rounded-lg object-cover border border-line"
                    />
                  ) : (
                    <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-line bg-navy/[.02]">
                      <span className="text-[11px] text-muted">{t('admin.catalogManager.noImage')}</span>
                    </div>
                  )}
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => catImageRef.current?.click()}
                      disabled={uploadingCatImage}
                      className="!py-1.5 text-xs flex items-center gap-1.5"
                    >
                      <UploadIcon className="h-3.5 w-3.5" />
                      {uploadingCatImage ? t('admin.catalogManager.uploading') : t('admin.catalogManager.uploadImage')}
                    </Button>
                    <input
                      ref={catImageRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => void handleUploadCategoryImage(e)}
                    />
                    <p className="mt-1 text-[11px] text-muted">{t('admin.catalogManager.imageFormatsHint')}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* ── Subcategories ───────────────────────────────── */}
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">
                  {t('admin.catalogManager.subcategories')} <span className="font-mono text-[11px] text-muted">({selectedCat.subcategories?.length ?? 0})</span>
                </h3>
                <button
                  onClick={() => setShowSubForm((v) => !v)}
                  className="flex items-center gap-1 text-xs font-semibold text-forest hover:text-forest-2 transition"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  {showSubForm ? t('common:common.button.cancel') : t('admin.catalogManager.addSubcategory')}
                </button>
              </div>

              {showSubForm && (
                <form onSubmit={(e) => void handleAddSubcategory(e)} className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-line bg-navy/[.02] p-4">
                  <h4 className="col-span-2 text-xs font-bold uppercase tracking-wide text-muted">{t('admin.catalogManager.newSubcategory')}</h4>
                  <Field label={t('admin.catalogManager.fields.name')}>
                    <Input
                      value={newSub.name}
                      onChange={(e) => setNewSub((v) => ({
                        ...v,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                      }))}
                      placeholder="CNC Turning Centres"
                      required
                    />
                  </Field>
                  <Field label={t('admin.catalogManager.fields.slug')} hint={t('admin.catalogManager.fields.autoFilled')}>
                    <Input value={newSub.slug} onChange={(e) => setNewSub((v) => ({ ...v, slug: e.target.value }))} placeholder="cnc-turning-centres" required />
                  </Field>
                  <div className="col-span-2">
                    <Field label={t('admin.catalogManager.fields.description')}>
                      <Textarea rows={2} value={newSub.description} onChange={(e) => setNewSub((v) => ({ ...v, description: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Button type="submit" disabled={addingSub || !newSub.name.trim() || !newSub.slug.trim()}>
                      {addingSub ? t('admin.catalogManager.adding') : t('admin.catalogManager.addSubcategory')}
                    </Button>
                  </div>
                </form>
              )}

              {(selectedCat.subcategories?.length ?? 0) === 0 ? (
                <p className="rounded-lg border border-dashed border-line py-6 text-center text-sm text-muted">
                  {t('admin.catalogManager.noSubcategoriesYet')}
                </p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line overflow-hidden">
                  {selectedCat.subcategories?.map((sub) => (
                    <li key={sub.id} className={`flex items-center gap-3 px-4 py-3 ${!sub.isActive ? 'opacity-50' : ''}`}>
                      {/* Image */}
                      <div className="flex-shrink-0">
                        {sub.imageUrl ? (
                          <img src={sub.imageUrl} alt={sub.name} className="h-9 w-12 rounded object-cover border border-line" />
                        ) : (
                          <div className="flex h-9 w-12 items-center justify-center rounded border border-dashed border-line bg-navy/[.02]">
                            <span className="text-[9px] text-muted">{t('admin.catalogManager.noImageShort')}</span>
                          </div>
                        )}
                      </div>

                      {/* Name + slug */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink leading-tight">{sub.name}</p>
                        <p className="font-mono text-[11px] text-muted">{sub.slug}</p>
                      </div>

                      {/* Status badge */}
                      {!sub.isActive && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">{t('admin.catalogManager.inactive')}</span>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Image upload */}
                        <button
                          onClick={() => subImageRefs.current[sub.id]?.click()}
                          disabled={uploadingSubImageId === sub.id}
                          className="p-1.5 text-muted hover:text-ink transition"
                          title={t('admin.catalogManager.uploadImageTitle')}
                        >
                          {uploadingSubImageId === sub.id
                            ? <span className="text-[10px]">...</span>
                            : <UploadIcon className="h-3.5 w-3.5" />
                          }
                        </button>
                        <input
                          ref={(el) => { subImageRefs.current[sub.id] = el; }}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => void handleUploadSubImage(sub, e)}
                        />

                        {/* Activate/deactivate */}
                        <button
                          onClick={() => void handleToggleSubActive(sub)}
                          className="rounded px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-ink border border-line transition"
                        >
                          {sub.isActive ? t('admin.catalogManager.deactivate') : t('admin.catalogManager.activate')}
                        </button>

                        {/* Hard delete */}
                        <button
                          onClick={() => void handleDeleteSubcategory(sub)}
                          disabled={deletingSubId === sub.id}
                          className="p-1.5 text-red-400 hover:text-red-600 transition"
                          title={t('admin.catalogManager.deleteSubcategoryTitle')}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* ── Spec fields ───────────────────────────────── */}
            <Card>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-ink mb-2">
                  {t('admin.catalogManager.specFields')} <span className="font-mono text-[11px] text-muted">({selectedCat.specFields?.length ?? 0})</span>
                </h3>

                {(selectedCat.specFields?.length ?? 0) === 0 ? (
                  <p className="rounded-lg border border-dashed border-line py-6 text-center text-sm text-muted">
                    {t('admin.catalogManager.noSpecFieldsYet')}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full text-sm">
                      <thead className="bg-navy/[.03] text-xs font-bold uppercase tracking-wide text-muted">
                        <tr>
                          {[
                            t('admin.catalogManager.columns.scope'),
                            t('admin.catalogManager.columns.fieldKey'),
                            t('admin.catalogManager.columns.label'),
                            t('admin.catalogManager.columns.type'),
                            t('admin.catalogManager.columns.unit'),
                            t('admin.catalogManager.columns.required'),
                            t('admin.catalogManager.columns.filterable'),
                            '',
                          ].map((h) => (
                            <th key={h} className="px-3 py-2.5 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {selectedCat.specFields?.map((f) => (
                          <tr key={f.id} className="hover:bg-navy/[.02]">
                            <td className="px-3 py-2.5">
                              {f.subcategoryId ? (
                                <span className="rounded-full bg-copper/10 px-2 py-0.5 text-[11px] font-semibold text-copper-2">
                                  {selectedCat.subcategories?.find((s) => s.id === f.subcategoryId)?.name ?? t('admin.catalogManager.unknownSubcategory')}
                                </span>
                              ) : (
                                <span className="rounded-full bg-navy/[.06] px-2 py-0.5 text-[11px] font-semibold text-navy/60">
                                  {t('admin.catalogManager.commonScope')}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[12px] text-ink">{f.fieldKey}</td>
                            <td className="px-3 py-2.5 text-ink">{f.fieldLabel}</td>
                            <td className="px-3 py-2.5">
                              <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[11px] font-semibold text-forest">
                                {f.fieldType}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[12px] text-muted">{f.unit ?? '—'}</td>
                            <td className="px-3 py-2.5">
                              {f.isRequired
                                ? <span className="text-[11px] font-bold text-copper">{t('common:common.label.yes')}</span>
                                : <span className="text-[11px] text-muted">{t('common:common.label.no')}</span>}
                            </td>
                            <td className="px-3 py-2.5">
                              {f.isFilterable
                                ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">{f.filterType}</span>
                                : <span className="text-[11px] text-muted">{t('common:common.label.no')}</span>}
                            </td>
                            <td className="px-3 py-2.5">
                              <button
                                onClick={() => void handleDeleteSpecField(f.id, f.fieldLabel)}
                                disabled={deletingFieldId === f.id}
                                className="text-red-400 hover:text-red-600 transition"
                                title={t('admin.catalogManager.removeFieldTitle', { label: f.fieldLabel })}
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add spec field form */}
              <div>
                <button
                  onClick={() => setShowFieldForm((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-2 transition"
                >
                  <PlusIcon className="h-4 w-4" />
                  {showFieldForm ? t('common:common.button.cancel') : t('admin.catalogManager.addSpecField')}
                </button>

                {showFieldForm && (
                  <form onSubmit={(e) => void handleAddSpecField(e)} className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-line bg-navy/[.02] p-5">
                    <h3 className="col-span-2 text-xs font-bold uppercase tracking-wide text-muted">{t('admin.catalogManager.newSpecField')}</h3>
                    <div className="col-span-2">
                      <Field label={t('admin.catalogManager.fields.appliesTo')} hint={t('admin.catalogManager.fields.appliesToHint')}>
                        <Select
                          value={newField.subcategoryId}
                          onChange={(e) => setNewField((v) => ({ ...v, subcategoryId: e.target.value }))}
                        >
                          <option value="">{t('admin.catalogManager.commonScope')}</option>
                          {selectedCat.subcategories?.map((sub) => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                    <Field label={t('admin.catalogManager.fields.fieldKey')} hint={t('admin.catalogManager.fields.fieldKeyHint')}>
                      <Input
                        value={newField.fieldKey}
                        onChange={(e) => setNewField((v) => ({ ...v, fieldKey: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                        placeholder="swing_over_bed"
                        required
                      />
                    </Field>
                    <Field label={t('admin.catalogManager.fields.fieldLabel')} hint={t('admin.catalogManager.fields.fieldLabelHint')}>
                      <Input
                        value={newField.fieldLabel}
                        onChange={(e) => setNewField((v) => ({ ...v, fieldLabel: e.target.value }))}
                        placeholder="Swing Over Bed"
                        required
                      />
                    </Field>
                    <Field label={t('admin.catalogManager.fields.type')}>
                      <Select
                        value={newField.fieldType}
                        onChange={(e) => setNewField((v) => ({ ...v, fieldType: e.target.value as SpecFieldType }))}
                      >
                        {FIELD_TYPES.map((ft) => <option key={ft} value={ft}>{ft}</option>)}
                      </Select>
                    </Field>
                    <Field label={t('admin.catalogManager.fields.unit')} hint={t('admin.catalogManager.fields.unitHint')}>
                      <Input
                        value={newField.unit}
                        onChange={(e) => setNewField((v) => ({ ...v, unit: e.target.value }))}
                        placeholder="mm"
                      />
                    </Field>
                    {newField.fieldType === 'select' && (
                      <div className="col-span-2">
                        <Field label={t('admin.catalogManager.fields.options')} hint={t('admin.catalogManager.fields.optionsHint')}>
                          <Input
                            value={newField.options}
                            onChange={(e) => setNewField((v) => ({ ...v, options: e.target.value }))}
                            placeholder="Horizontal, Vertical"
                          />
                        </Field>
                      </div>
                    )}
                    <div className="flex items-center gap-5">
                      <label className="flex items-center gap-2 text-sm font-medium text-ink">
                        <input
                          type="checkbox"
                          checked={newField.isRequired}
                          onChange={(e) => setNewField((v) => ({ ...v, isRequired: e.target.checked }))}
                          className="h-4 w-4 rounded border-line text-forest focus:ring-forest/30"
                        />
                        {t('admin.catalogManager.fields.required')}
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium text-ink">
                        <input
                          type="checkbox"
                          checked={newField.isFilterable}
                          onChange={(e) => setNewField((v) => ({ ...v, isFilterable: e.target.checked }))}
                          className="h-4 w-4 rounded border-line text-forest focus:ring-forest/30"
                        />
                        {t('admin.catalogManager.fields.filterable')}
                      </label>
                    </div>
                    {newField.isFilterable && (
                      <Field label={t('admin.catalogManager.fields.filterType')}>
                        <Select
                          value={newField.filterType}
                          onChange={(e) => setNewField((v) => ({ ...v, filterType: e.target.value as SpecFilterType }))}
                        >
                          {FILTER_TYPES.map((ft) => <option key={ft} value={ft}>{ft}</option>)}
                        </Select>
                      </Field>
                    )}
                    <div className="col-span-2">
                      <Field label={t('admin.catalogManager.fields.helpText')} hint={t('admin.catalogManager.fields.helpTextHint')}>
                        <Input
                          value={newField.helpText}
                          onChange={(e) => setNewField((v) => ({ ...v, helpText: e.target.value }))}
                          placeholder="Measure from bed surface to top of workpiece"
                        />
                      </Field>
                    </div>
                    <div className="col-span-2">
                      <Button type="submit" disabled={addingField || !newField.fieldKey.trim() || !newField.fieldLabel.trim()}>
                        {addingField ? t('admin.catalogManager.adding') : t('admin.catalogManager.addField')}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-line">
            <p className="text-sm text-muted">{t('admin.catalogManager.selectCategoryPrompt')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
