"use client"

import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import {
  UserCircle,
  Bell,
  ShieldCheck,
  CreditCard,
  LogOut,
  Camera,
  Dumbbell,
  MapPin,
  Save,
  Crown,
  Check,
  ChevronRight,
  Award,
  BadgeCheck,
  Target,
  Calendar,
  Plus,
  X,
  Loader2,
  Lock,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useProfile } from "@/hooks/use-profile"
import { uploadAvatar } from "@/lib/upload-avatar"
import { uploadHeader } from "@/lib/upload-header"
import HeaderCropModal from "@/components/settings/header-crop-modal"
import { PREFECTURES, EXERCISE_OPTIONS, GENDER_OPTIONS } from "@/lib/constants"
import type { Achievement } from "@/types/profile"

function calcAge(birthday: string | null): number | null {
  if (!birthday) return null
  const d = new Date(birthday)
  if (Number.isNaN(d.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age
}

/* ── Settings categories ─────────────────────────────── */
const categories = [
  { id: "account", label: "アカウント", icon: UserCircle },
  { id: "notification", label: "通知", icon: Bell },
  { id: "privacy", label: "プライバシー", icon: ShieldCheck },
  { id: "subscription", label: "プラン", icon: CreditCard },
] as const

type Category = (typeof categories)[number]["id"]

/* ── Shared input class ──────────────────────────────── */
const inputClass =
  "w-full rounded-lg border border-border bg-secondary py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:shadow-[0_0_20px_rgba(212,175,55,0.1)]"

const labelClass =
  "text-xs font-bold uppercase tracking-wider text-muted-foreground"

/* ── Main Component ──────────────────────────────────── */
export default function SettingsPage() {
  const router = useRouter()
  const { profile, isLoading, updateProfile } = useProfile()
  const [active, setActive] = useState<Category>("account")
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  /* account state */
  const [name, setName] = useState("")
  const [nickname, setNickname] = useState("")
  const [bio, setBio] = useState("")
  const [email, setEmail] = useState("")
  const [gender, setGender] = useState("")
  const [birthday, setBirthday] = useState("")
  const [prefecture, setPrefecture] = useState("")
  const [homeGym, setHomeGym] = useState("")
  const [exercises, setExercises] = useState<string[]>([])
  const [isAgePublic, setIsAgePublic] = useState(true)
  const [isPrefecturePublic, setIsPrefecturePublic] = useState(true)
  const [isHomeGymPublic, setIsHomeGymPublic] = useState(true)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState<string | null>(null)
  const [headerCropOpen, setHeaderCropOpen] = useState(false)
  const [headerCropImageSrc, setHeaderCropImageSrc] = useState<string>("")
  const headerInputRef = useRef<HTMLInputElement>(null)
  const [bench, setBench] = useState("0")
  const [squat, setSquat] = useState("0")
  const [deadlift, setDeadlift] = useState("0")
  const [area, setArea] = useState("")
  const [gym, setGym] = useState("")
  const [trainingYears, setTrainingYears] = useState("0")
  const [goal, setGoal] = useState("")
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [certifications, setCertifications] = useState<string[]>([])
  const [instagramId, setInstagramId] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [twitterUrl, setTwitterUrl] = useState("")
  const [tiktokUrl, setTiktokUrl] = useState("")
  const [facebookUrl, setFacebookUrl] = useState("")

  /* new achievement form */
  const [newAchTitle, setNewAchTitle] = useState("")
  const [newAchYear, setNewAchYear] = useState(new Date().getFullYear().toString())
  const [newAchRank, setNewAchRank] = useState("")

  /* new certification form */
  const [newCert, setNewCert] = useState("")

  /* notification state */
  const [notifWorkout, setNotifWorkout] = useState(true)
  const [notifGroup, setNotifGroup] = useState(true)
  const [notifAdmin, setNotifAdmin] = useState(false)
  const [notifEmail, setNotifEmail] = useState(false)
  /** LINEでログイン済みか（user_metadata.line_user_id の有無） */
  const [hasLineLinked, setHasLineLinked] = useState<boolean | null>(null)

  /* privacy state */
  const [profilePublic, setProfilePublic] = useState(true)
  const [statsPublic, setStatsPublic] = useState(true)
  const [allowDm, setAllowDm] = useState(true)

  /* Load profile data into form */
  useEffect(() => {
    if (profile) {
      const nick = (profile as { nickname?: string | null }).nickname ?? profile.name ?? ""
      setName(nick)
      setNickname(nick)
      setBio(profile.bio ?? "")
      setEmail(profile.email ?? "")
      setGender((profile as { gender?: string | null }).gender ?? "")
      setBirthday((profile as { birthday?: string | null }).birthday ?? "")
      setPrefecture((profile as { prefecture?: string | null }).prefecture ?? "")
      setHomeGym((profile as { home_gym?: string | null }).home_gym ?? profile.gym ?? "")
      setExercises(Array.isArray((profile as { exercises?: string[] | null }).exercises) ? (profile as { exercises: string[] }).exercises : [])
      setIsAgePublic((profile as { is_age_public?: boolean }).is_age_public !== false)
      setIsPrefecturePublic((profile as { is_prefecture_public?: boolean }).is_prefecture_public !== false)
      setIsHomeGymPublic((profile as { is_home_gym_public?: boolean }).is_home_gym_public !== false)
      setAvatarPreviewUrl(profile.avatar_url ?? null)
      setHeaderPreviewUrl((profile as { header_url?: string | null }).header_url ?? null)
      setBench(String(profile.bench_max ?? 0))
      setSquat(String(profile.squat_max ?? 0))
      setDeadlift(String(profile.deadlift_max ?? 0))
      setArea(profile.area ?? "")
      setGym(profile.gym ?? "")
      setTrainingYears(String(profile.training_years ?? 0))
      setGoal(profile.goal ?? "")
      setAchievements(Array.isArray(profile.achievements) ? profile.achievements : [])
      setCertifications(Array.isArray(profile.certifications) ? profile.certifications : [])
      setInstagramId((profile as { instagram_id?: string | null }).instagram_id ?? "")
      setYoutubeUrl((profile as { youtube_url?: string | null }).youtube_url ?? "")
      setTwitterUrl((profile as { twitter_url?: string | null }).twitter_url ?? "")
      setTiktokUrl((profile as { tiktok_url?: string | null }).tiktok_url ?? "")
      setFacebookUrl((profile as { facebook_url?: string | null }).facebook_url ?? "")
    }
  }, [profile])

  /* LINEでログイン済みか（user_metadata.line_user_id）を取得 */
  useEffect(() => {
    let cancelled = false
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!cancelled) setHasLineLinked(!!(user?.user_metadata as { line_user_id?: string } | undefined)?.line_user_id)
      })
    return () => { cancelled = true }
  }, [])

  const markChanged = () => setHasChanges(true)

  /* Save handler */
  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile({
        name: nickname || name,
        nickname: nickname || name,
        bio,
        email,
        gender: gender || undefined,
        birthday: birthday || undefined,
        prefecture: prefecture || undefined,
        home_gym: homeGym || undefined,
        exercises: exercises.length > 0 ? exercises : undefined,
        is_age_public: isAgePublic,
        is_prefecture_public: isPrefecturePublic,
        is_home_gym_public: isHomeGymPublic,
        bench_max: Number(bench) || 0,
        squat_max: Number(squat) || 0,
        deadlift_max: Number(deadlift) || 0,
        area: prefecture || area,
        gym: homeGym || gym,
        training_years: Number(trainingYears) || 0,
        goal,
        achievements,
        certifications,
        instagram_id: instagramId || undefined,
        youtube_url: youtubeUrl || undefined,
        twitter_url: twitterUrl || undefined,
        tiktok_url: tiktokUrl || undefined,
        facebook_url: facebookUrl || undefined,
      })
      setHasChanges(false)
      router.refresh()
    } catch (e) {
      console.error("Save failed:", e)
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    try {
      const url = await uploadAvatar(profile.id, file)
      setAvatarPreviewUrl(url)
      await updateProfile({ avatar_url: url })
      router.refresh()
      window.location.reload()
    } catch (err) {
      console.error("Avatar upload failed:", err)
    }
    e.target.value = ""
  }

  function handleHeaderFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const url = URL.createObjectURL(file)
    setHeaderCropImageSrc(url)
    setHeaderCropOpen(true)
    e.target.value = ""
  }

  async function handleHeaderCropConfirm(blob: Blob) {
    if (!profile) return
    try {
      const url = await uploadHeader(profile.id, blob)
      setHeaderPreviewUrl(url)
      await updateProfile({ header_url: url } as { header_url: string })
      router.refresh()
    } catch (err) {
      console.error("Header upload failed:", err)
    }
  }

  function handleHeaderCropOpenChange(open: boolean) {
    if (!open && headerCropImageSrc) {
      URL.revokeObjectURL(headerCropImageSrc)
      setHeaderCropImageSrc("")
    }
    setHeaderCropOpen(open)
  }

  function toggleExercise(opt: string) {
    setExercises((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))
    markChanged()
  }

  const displayName = nickname || name
  const age = calcAge(birthday || null)

  /* Achievement helpers */
  function addAchievement() {
    if (!newAchTitle.trim() || !newAchRank.trim()) return
    setAchievements((prev) => [
      ...prev,
      { title: newAchTitle.trim(), year: Number(newAchYear), rank: newAchRank.trim() },
    ])
    setNewAchTitle("")
    setNewAchYear(new Date().getFullYear().toString())
    setNewAchRank("")
    markChanged()
  }

  function removeAchievement(index: number) {
    setAchievements((prev) => prev.filter((_, i) => i !== index))
    markChanged()
  }

  /* Certification helpers */
  function addCertification() {
    if (!newCert.trim()) return
    setCertifications((prev) => [...prev, newCert.trim()])
    setNewCert("")
    markChanged()
  }

  function removeCertification(index: number) {
    setCertifications((prev) => prev.filter((_, i) => i !== index))
    markChanged()
  }

  /* ── Render Account ───────────────────────────── */
  function renderAccount() {
    return (
      <div className="flex flex-col gap-8">
        {/* Header image */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-4">
            ヘッダー画像を変更
          </h3>
          <div className="rounded-xl border border-border bg-secondary overflow-hidden">
            <div className="aspect-[3/1] w-full max-h-32 sm:max-h-40 relative">
              {headerPreviewUrl ? (
                <Image
                  src={headerPreviewUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              ref={headerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleHeaderFileSelect}
            />
            <button
              type="button"
              onClick={() => headerInputRef.current?.click()}
              className="text-sm font-semibold text-gold hover:text-gold-light transition-colors"
            >
              ヘッダー画像を選択
            </button>
            <span className="text-xs text-muted-foreground">3:1推奨。選択後に切り抜きができます</span>
          </div>
        </div>

        {/* Avatar */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-4">
            プロフィール写真
          </h3>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="relative group h-24 w-24 shrink-0 rounded-full border-2 border-border bg-secondary overflow-hidden flex items-center justify-center"
            >
              {avatarPreviewUrl ? (
                <Image src={avatarPreviewUrl} alt="" fill className="object-cover" unoptimized />
              ) : (
                <span className="text-3xl font-black text-gold">{displayName.charAt(0) || "?"}</span>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-foreground" />
              </span>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="text-left text-sm font-semibold text-gold hover:text-gold-light transition-colors"
              >
                写真をアップロード
              </button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP。2MB以下
              </p>
            </div>
          </div>
        </div>

        {/* ニックネーム & Email */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="s-nickname" className={labelClass}>
              ニックネーム <span className="text-red-400">*</span>
            </label>
            <input
              id="s-nickname"
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setName(e.target.value); markChanged() }}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="s-email" className={labelClass}>
              メールアドレス
            </label>
            <input
              id="s-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); markChanged() }}
              className={inputClass}
            />
          </div>
        </div>

        {/* 性別 */}
        <div className="flex flex-col gap-2">
          <span className={labelClass}>性別</span>
          <div className="flex flex-wrap gap-4">
            {GENDER_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value={opt.value}
                  checked={gender === opt.value}
                  onChange={() => { setGender(opt.value); markChanged() }}
                  className="h-4 w-4 border-border text-gold focus:ring-gold"
                />
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 誕生日 + 年齢 + 非公開 */}
        <div className="flex flex-col gap-2">
          <label htmlFor="s-birthday" className={labelClass}>誕生日</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="s-birthday"
              type="date"
              value={birthday}
              onChange={(e) => { setBirthday(e.target.value); markChanged() }}
              className={cn(inputClass, "flex-1 min-w-0")}
            />
            {age !== null && (
              <span className="rounded-full bg-gold/10 px-3 py-1.5 text-sm font-bold text-gold">{age}歳</span>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!isAgePublic}
              onChange={(e) => { setIsAgePublic(!e.target.checked); markChanged() }}
              className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
            />
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> 年齢を非公開にする
            </span>
          </label>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-2">
          <label htmlFor="s-bio" className={labelClass}>
            自己紹介
          </label>
          <textarea
            id="s-bio"
            rows={3}
            value={bio}
            onChange={(e) => { setBio(e.target.value); markChanged() }}
            placeholder="パワーリフティング中心。ベンチ100kg目標！今は週4でエニタイムに行ってます。"
            className={cn(inputClass, "resize-none")}
          />
        </div>

        {/* 住まい（都道府県） + 非公開 */}
        <div className="flex flex-col gap-2">
          <label htmlFor="s-prefecture" className={labelClass}>住まい（都道府県）</label>
          <select
            id="s-prefecture"
            value={prefecture}
            onChange={(e) => { setPrefecture(e.target.value); markChanged() }}
            className={inputClass}
          >
            <option value="">選択してください</option>
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!isPrefecturePublic}
              onChange={(e) => { setIsPrefecturePublic(!e.target.checked); markChanged() }}
              className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
            />
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> 住まいを非公開にする
            </span>
          </label>
        </div>

        {/* よく行くジム + 非公開 */}
        <div className="flex flex-col gap-2">
          <label htmlFor="s-home-gym" className={labelClass}>
            <Dumbbell className="inline h-3 w-3 mr-1 text-gold/60" />
            よく行くジム
          </label>
          <input
            id="s-home-gym"
            type="text"
            value={homeGym}
            onChange={(e) => { setHomeGym(e.target.value); markChanged() }}
            className={inputClass}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!isHomeGymPublic}
              onChange={(e) => { setIsHomeGymPublic(!e.target.checked); markChanged() }}
              className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
            />
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> よく行くジムを非公開にする
            </span>
          </label>
        </div>

        {/* エクササイズ（複数選択） */}
        <div className="flex flex-col gap-2">
          <span className={labelClass}>やってる種目（複数選択可）</span>
          <div className="flex flex-wrap gap-2">
            {EXERCISE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleExercise(opt)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all",
                  exercises.includes(opt)
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-border bg-secondary text-muted-foreground hover:border-foreground/20"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* SNS リンク */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">
            SNS リンク
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            プロフィールに表示するリンクを入力（空欄は非表示）
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="s-instagram" className={labelClass}>Instagram</label>
              <input id="s-instagram" type="text" value={instagramId} onChange={(e) => { setInstagramId(e.target.value); markChanged() }} placeholder="https://instagram.com/username または @username" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="s-youtube" className={labelClass}>YouTube</label>
              <input id="s-youtube" type="url" value={youtubeUrl} onChange={(e) => { setYoutubeUrl(e.target.value); markChanged() }} placeholder="https://youtube.com/@channel" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="s-twitter" className={labelClass}>X (Twitter)</label>
              <input id="s-twitter" type="url" value={twitterUrl} onChange={(e) => { setTwitterUrl(e.target.value); markChanged() }} placeholder="https://x.com/username" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="s-tiktok" className={labelClass}>TikTok</label>
              <input id="s-tiktok" type="url" value={tiktokUrl} onChange={(e) => { setTiktokUrl(e.target.value); markChanged() }} placeholder="https://tiktok.com/@username" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="s-facebook" className={labelClass}>Facebook</label>
              <input id="s-facebook" type="url" value={facebookUrl} onChange={(e) => { setFacebookUrl(e.target.value); markChanged() }} placeholder="https://facebook.com/username" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Training years & Goal */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="s-years" className={labelClass}>
              <Calendar className="inline h-3 w-3 mr-1 text-gold/60" />
              トレーニング歴
            </label>
            <div className="relative">
              <input
                id="s-years"
                type="number"
                min="0"
                value={trainingYears}
                onChange={(e) => { setTrainingYears(e.target.value); markChanged() }}
                className={cn(inputClass, "pr-10")}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                年
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="s-goal" className={labelClass}>
              <Target className="inline h-3 w-3 mr-1 text-gold/60" />
              現在の目標
            </label>
            <input
              id="s-goal"
              type="text"
              value={goal}
              placeholder="例: BIG3合計600kg達成"
              onChange={(e) => { setGoal(e.target.value); markChanged() }}
              className={inputClass}
            />
          </div>
        </div>

        {/* My Stats */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1">
            マイ記録 (MAX)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            BIG3 の最大記録を入力してください
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "s-bench", label: "ベンチ", value: bench, set: setBench, icon: "BP" },
              { id: "s-squat", label: "スクワット", value: squat, set: setSquat, icon: "SQ" },
              { id: "s-deadlift", label: "デッドリフト", value: deadlift, set: setDeadlift, icon: "DL" },
            ].map((s) => (
              <div key={s.id} className="flex flex-col gap-2">
                <label htmlFor={s.id} className={labelClass}>
                  {s.label}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gold/60">
                    {s.icon}
                  </span>
                  <input
                    id={s.id}
                    type="number"
                    value={s.value}
                    onChange={(e) => { s.set(e.target.value); markChanged() }}
                    className={cn(inputClass, "pl-10 pr-10 text-center font-bold border-gold/30 focus:border-gold")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    kg
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-gold/20 bg-gold/5 py-2.5">
            <Dumbbell className="h-4 w-4 text-gold" />
            <span className="text-sm font-bold text-gold">
              {"合計: "}
              {(Number(bench) || 0) + (Number(squat) || 0) + (Number(deadlift) || 0)}
              kg
            </span>
          </div>
        </div>

        {/* ── Achievements ──────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-bold text-foreground">
              コンテスト実績
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            大会名・年度・順位を追加できます
          </p>

          {/* Existing achievements */}
          {achievements.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {achievements.map((a, i) => (
                <div
                  key={`${a.title}-${a.year}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary px-4 py-3"
                >
                  <div className="flex items-center justify-center h-8 w-8 shrink-0 rounded-full bg-gold/10 text-gold">
                    <span className="text-xs font-black">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {a.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.year}年 / {a.rank}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAchievement(i)}
                    className="flex items-center justify-center h-7 w-7 rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    aria-label="削除"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add achievement form */}
          <div className="rounded-lg border border-dashed border-border/60 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                placeholder="大会名"
                value={newAchTitle}
                onChange={(e) => setNewAchTitle(e.target.value)}
                className={cn(inputClass, "py-2.5 text-xs")}
              />
              <input
                type="number"
                placeholder="年度"
                value={newAchYear}
                onChange={(e) => setNewAchYear(e.target.value)}
                className={cn(inputClass, "py-2.5 text-xs")}
              />
              <input
                type="text"
                placeholder="順位 (例: 優勝, 3位)"
                value={newAchRank}
                onChange={(e) => setNewAchRank(e.target.value)}
                className={cn(inputClass, "py-2.5 text-xs")}
              />
            </div>
            <button
              type="button"
              onClick={addAchievement}
              disabled={!newAchTitle.trim() || !newAchRank.trim()}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all",
                newAchTitle.trim() && newAchRank.trim()
                  ? "bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20"
                  : "bg-secondary text-muted-foreground/40 border border-transparent cursor-not-allowed"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              実績を追加
            </button>
          </div>
        </div>

        {/* ── Certifications ────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BadgeCheck className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-bold text-foreground">
              保有資格
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            トレーニング関連の資格を追加できます
          </p>

          {/* Existing certifications */}
          {certifications.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {certifications.map((cert, i) => (
                <span
                  key={`${cert}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.06] pl-3 pr-1.5 py-1.5 text-xs font-bold text-gold"
                >
                  <BadgeCheck className="h-3 w-3" />
                  {cert}
                  <button
                    type="button"
                    onClick={() => removeCertification(i)}
                    className="flex items-center justify-center h-5 w-5 rounded-full hover:bg-red-500/10 hover:text-red-400 transition-colors ml-0.5"
                    aria-label={`${cert}を削除`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add certification form */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="資格名を入力 (例: NSCA-CPT)"
              value={newCert}
              onChange={(e) => setNewCert(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCertification() } }}
              className={cn(inputClass, "py-2.5 text-xs flex-1")}
            />
            <button
              type="button"
              onClick={addCertification}
              disabled={!newCert.trim()}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold transition-all shrink-0",
                newCert.trim()
                  ? "bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20"
                  : "bg-secondary text-muted-foreground/40 border border-transparent cursor-not-allowed"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              追加
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Render Notification ──────────────────────── */
  function renderNotification() {
    const items = [
      { label: "合トレの誘いを受け取る", desc: "他のユーザーからの合トレリクエスト通知", checked: notifWorkout, onChange: (v: boolean) => { setNotifWorkout(v); markChanged() } },
      { label: "グループの新着メッセージ", desc: "所属グループの掲示板に新しい投稿があった時", checked: notifGroup, onChange: (v: boolean) => { setNotifGroup(v); markChanged() } },
      { label: "運営からのお知らせ", desc: "FITPEAK からのアップデートやキャンペーン情報", checked: notifAdmin, onChange: (v: boolean) => { setNotifAdmin(v); markChanged() } },
      { label: "メール通知", desc: "重要な通知をメールでも受け取る", checked: notifEmail, onChange: (v: boolean) => { setNotifEmail(v); markChanged() } },
    ]

    return (
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-foreground mb-2">プッシュ通知</h3>
        <p className="text-xs text-muted-foreground mb-5">受け取る通知の種類を選択してください</p>
        <div className="flex flex-col divide-y divide-border/60">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-4 first:pt-0">
              <div className="flex flex-col gap-0.5 pr-4">
                <span className="text-sm font-semibold text-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </div>
              <Switch checked={item.checked} onCheckedChange={item.onChange} className="data-[state=checked]:bg-gold shrink-0" />
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-border/60">
          <h4 className="text-sm font-semibold text-foreground mb-1">公式LINE連携</h4>
          {hasLineLinked === true && (
            <p className="text-xs text-[#06C755] font-medium mb-2">LINEでログイン済みです。公式アカウントを友だち追加すると通知が届きます。</p>
          )}
          {hasLineLinked === false && (
            <p className="text-xs text-muted-foreground mb-2">LINEでログインしていません。一度ログアウトして「LINEでログイン」すると、通知をLINEで受け取れます。</p>
          )}
          <p className="text-xs text-muted-foreground mb-4">
            公式LINEを友だち追加すると、新着メッセージ・合トレ申請・新規フォローなどの通知がLINEに届きます。
          </p>
          {process.env.NEXT_PUBLIC_LINE_OFFICIAL_ADD_URL ? (
            <a
              href={process.env.NEXT_PUBLIC_LINE_OFFICIAL_ADD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#06C755] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.039 1.085l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              公式LINEを友だち追加
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">公式LINEの連携は準備中です。</p>
          )}
        </div>
      </div>
    )
  }

  /* ── Render Privacy ───────────────────────────── */
  function renderPrivacy() {
    const items = [
      { label: "プロフィールを公開", desc: "他のユーザーがあなたのプロフィールを閲覧できます", checked: profilePublic, onChange: (v: boolean) => { setProfilePublic(v); markChanged() } },
      { label: "Stats (MAX記録) を公開", desc: "BIG3 の記録を他のユーザーに表示します", checked: statsPublic, onChange: (v: boolean) => { setStatsPublic(v); markChanged() } },
      { label: "ダイレクトメッセージを許可", desc: "フォロー外のユーザーからの DM を受け付けます", checked: allowDm, onChange: (v: boolean) => { setAllowDm(v); markChanged() } },
    ]

    return (
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-foreground mb-2">プライバシー設定</h3>
        <p className="text-xs text-muted-foreground mb-5">あなたの情報の公開範囲を管理します</p>
        <div className="flex flex-col divide-y divide-border/60">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-4 first:pt-0">
              <div className="flex flex-col gap-0.5 pr-4">
                <span className="text-sm font-semibold text-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </div>
              <Switch checked={item.checked} onCheckedChange={item.onChange} className="data-[state=checked]:bg-gold shrink-0" />
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">ブロックリスト</h4>
              <p className="text-xs text-muted-foreground mt-0.5">ブロック中のユーザー: 0人</p>
            </div>
            <button type="button" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              管理する
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Render Subscription ──────────────────────── */
  function renderSubscription() {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-2">現在のプラン</h3>
          <p className="text-xs text-muted-foreground mb-5">プランを管理して、FITPEAK を最大限に活用しましょう</p>
        </div>
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15">
              <Crown className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-lg font-black text-gold">PRO MEMBER</p>
              <p className="text-xs text-muted-foreground">2026/12/31 まで有効</p>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 mb-5">
            {["合トレ募集の優先表示", "プロフィールに PRO バッジ表示", "DM 無制限", "広告非表示", "詳細なトレーニング統計"].map((feat) => (
              <div key={feat} className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 shrink-0">
                  <Check className="h-3 w-3 text-gold" />
                </div>
                <span className="text-sm text-foreground">{feat}</span>
              </div>
            ))}
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-black text-foreground">{"980"}</span>
            <span className="text-sm font-bold text-muted-foreground">{"円 / 月"}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm font-bold text-muted-foreground mb-3">FREE PLAN</p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>- 合トレ募集 月5回まで</li>
            <li>- DM 月10通まで</li>
            <li>- 広告あり</li>
          </ul>
          <p className="text-xs text-muted-foreground/60 mt-3">
            {"現在 PRO メンバーです。ダウングレードする場合は"}
            <button type="button" className="text-gold/70 underline hover:text-gold transition-colors">こちら</button>
          </p>
        </div>
        <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent py-3 text-sm font-bold text-foreground transition-all hover:border-gold/30 hover:bg-secondary/80">
          <CreditCard className="h-4 w-4" />
          支払い方法を管理
        </button>
      </div>
    )
  }

  /* ── Content map ──────────────────────────────── */
  const contentMap: Record<Category, React.ReactNode> = {
    account: renderAccount(),
    notification: renderNotification(),
    privacy: renderPrivacy(),
    subscription: renderSubscription(),
  }

  const titleMap: Record<Category, string> = {
    account: "アカウント設定",
    notification: "通知設定",
    privacy: "プライバシーとセキュリティ",
    subscription: "プラン管理",
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">設定</h1>
        <p className="text-sm text-muted-foreground mt-1">アカウントや通知の設定を管理します</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile: horizontal scroll */}
        <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActive(cat.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition-all shrink-0",
                active === cat.id
                  ? "bg-gold/10 text-gold border border-gold/30"
                  : "bg-secondary text-muted-foreground border border-transparent hover:text-foreground"
              )}
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Desktop: vertical sidebar */}
        <div className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col gap-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActive(cat.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 text-left",
                active === cat.id
                  ? "bg-gold/10 text-gold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <cat.icon className={cn("h-5 w-5 shrink-0", active === cat.id && "text-gold")} />
              {cat.label}
            </button>
          ))}
          <div className="mt-6 pt-4 border-t border-border/40">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              ログアウト
            </button>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-border/60 bg-card p-6 sm:p-8">
            <h2 className="text-lg font-black text-foreground tracking-tight mb-6">
              {titleMap[active]}
            </h2>
            {contentMap[active]}
            {active !== "subscription" && (
              <div className="mt-8 flex items-center justify-between gap-4 pt-6 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                  {hasChanges ? "* 保存されていない変更があります" : "すべて最新です"}
                </p>
                <button
                  type="button"
                  disabled={!hasChanges || saving}
                  onClick={handleSave}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold tracking-wide transition-all duration-300",
                    hasChanges
                      ? "bg-gold text-[#050505] hover:bg-gold-light hover:shadow-lg hover:shadow-gold/25 active:scale-[0.98]"
                      : "bg-secondary text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "保存中..." : "変更を保存"}
                </button>
              </div>
            )}
          </div>

          <div className="lg:hidden mt-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 py-3.5 text-sm font-bold text-red-400 transition-all hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {headerCropImageSrc && (
        <HeaderCropModal
          open={headerCropOpen}
          onOpenChange={handleHeaderCropOpenChange}
          imageSrc={headerCropImageSrc}
          onConfirm={handleHeaderCropConfirm}
        />
      )}
    </div>
  )
}
