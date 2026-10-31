import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useClerk, UserButton, SignInButton } from '@clerk/clerk-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {
  listWorkspaces,
  getWorkspace,
  deleteWorkspace,
  createQuickConsult,
  createCaseProject,
  promoteWorkspace,
  uploadDocument,
  askWorkspaceAssistant,
  submitWorkspacePrompt,
  listArgumentSheets,
  generateArgumentSheet,
} from '../services/workspaceApi';
import {
  Briefcase,
  Scale,
  FileText,
  Gavel,
  BookOpen,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Menu,
  X,
  Paperclip,
  ArrowUp,
  Download,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Lock,
  Calendar,
  ArrowUpRight,
  Landmark,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import DraftingStudio from '../components/DraftingStudio';
import { DocumentsStudio } from '../components/DocumentsStudio';
import { DocumentReviewStudio } from '../components/DocumentReviewStudio';
import { FreeArgumentsStudio } from '../components/FreeArgumentsStudio';
import { loadFreeArgSessions, deleteFreeArgSession } from '../utils/freeArgsStorage';
import { MatterWarRoomDashboard } from '../components/MatterWarRoomDashboard';
import { WhatIsNextCards } from '../components/WhatIsNextCards';

import '../styles/WorkspacePage.css';

const MODES = [
  { id: 'AUTO', label: 'Auto' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'RESEARCH', label: 'Research' },
  { id: 'QUERY', label: 'Query' },
  { id: 'REVIEW', label: 'Review' },
];

const formatDateDDMMYYYY = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const TASK_CARDS = [
  {
    id: 'research-issue',
    title: 'Research a legal issue',
    desc: 'Get the applicable law, provisions and current legal position',
    mode: 'Research',
    action: 'prompt',
    initialPrompt: 'Research legal position on: ',
  },
  {
    id: 'find-judgments',
    title: 'Find judgments for my argument',
    desc: 'Find cases that support or weaken your argument',
    mode: 'Research',
    action: 'prompt',
    initialPrompt: 'Find supporting and distinguishing precedents for: ',
  },
  {
    id: 'draft-facts',
    title: 'Draft from my facts',
    desc: 'Turn your facts into the right legal draft',
    mode: 'Draft',
    action: 'prompt',
    initialPrompt: 'Draft from these facts: ',
  },
  {
    id: 'review-doc',
    title: 'Review a document or filing',
    desc: 'Spot weak points, risks and missing protections',
    mode: 'Review',
    action: 'documents',
  },
  {
    id: 'prepare-hearing',
    title: 'Prepare for a hearing',
    desc: 'Build arguments, anticipate counters and prepare authorities',
    mode: 'Draft',
    action: 'arguments',
  },
  {
    id: 'track-case',
    title: 'Track your case',
    desc: 'Enter a CNR to follow hearings, orders and case status',
    action: 'matter_track',
  },
  {
    id: 'draft-template',
    title: 'Draft with a verified legal template',
    desc: 'Use a verified legal structure instead of drafting from scratch.',
    mode: 'Draft',
    action: 'drafting',
  },
  {
    id: 'ocr-document',
    title: 'Make a scanned document searchable',
    desc: 'Clean up scanned PDFs and extract searchable text',
    action: 'ocr',
  },
  {
    id: 'translate-document',
    title: 'Translate a legal document',
    desc: 'Translate while preserving legal meaning and structure',
    action: 'translation',
  },
];

// Local storage persistence helpers to guarantee chat retention across navigation & back button
const getLocalStorageChatKey = (wsId) => `refirm_chat_history_${wsId || 'session'}`;

const saveLocalChat = (wsId, msgs) => {
  if (!msgs || msgs.length === 0) return;
  try {
    localStorage.setItem(getLocalStorageChatKey(wsId), JSON.stringify(msgs));
  } catch (err) {
    console.warn('Failed to cache chat in localStorage:', err);
  }
};

const loadLocalChat = (wsId) => {
  try {
    const raw = localStorage.getItem(getLocalStorageChatKey(wsId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to read chat from localStorage:', err);
  }
  return null;
};

export const WorkspacePage = ({ defaultView = 'home' }) => {
  const { workspaceId: routeWorkspaceId } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const clerk = useClerk();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Active view: 'home' (Screenshots 1 & 2) | 'matter' (Image 5) | 'chat' (Image 1, 3, 4) | 'documents' | 'drafting' | 'review' | 'free-arguments'
  const [activeView, setActiveView] = useState(() => {
    if (tabParam === 'free-arguments' || tabParam === 'arguments-studio' || tabParam === 'arguments') return 'free-arguments';
    if (tabParam === 'drafting') return 'drafting';
    if (tabParam === 'documents' || tabParam === 'review') return 'documents';
    if (tabParam === 'chat') return 'chat';
    if (tabParam === 'matter') return 'matter';
    if (tabParam === 'home') return 'home';
    if (defaultView === 'arguments') return 'free-arguments';
    if (defaultView) return defaultView;
    return 'home'; // Default to Home ("Good morning. What are we working on?")
  });

  // Synchronize URL tabParam changes with activeView (e.g. Navbar clicks, browser back/forward)
  useEffect(() => {
    if (!tabParam) return;
    if (tabParam === 'free-arguments' || tabParam === 'arguments-studio' || tabParam === 'arguments') {
      setActiveView('free-arguments');
    } else if (tabParam === 'drafting') {
      setActiveView('drafting');
    } else if (tabParam === 'documents' || tabParam === 'review') {
      setActiveView('documents');
    } else if (tabParam === 'chat') {
      setActiveView('chat');
    } else if (tabParam === 'matter') {
      setActiveView('matter');
    } else if (tabParam === 'home') {
      setActiveView('home');
    }
  }, [tabParam]);

  const [freeArgSessions, setFreeArgSessions] = useState(() => loadFreeArgSessions());
  const [selectedFreeArgSession, setSelectedFreeArgSession] = useState(null);
  const [selectedReviewDoc, setSelectedReviewDoc] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning.';
    if (hour < 17) return 'Good afternoon.';
    return 'Good evening.';
  };

  // Sidebar collapse state (true = 56px icon rail as in Image 4)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Workspaces list
  const [workspaces, setWorkspaces] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(routeWorkspaceId || null);
  const [workspaceDetail, setWorkspaceDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Search filter in sidebar
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Credits / Testing state
  const [showCreditsMenu, setShowCreditsMenu] = useState(false);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

  // Chat conversation state with immediate localStorage pre-hydration
  const [activeChatTitle, setActiveChatTitle] = useState('');
  const [chatMessages, setChatMessages] = useState(() => {
    const cached = loadLocalChat(routeWorkspaceId);
    return cached || [];
  });

  // Prompt dock input & dropdown states
  const [promptInput, setPromptInput] = useState('');
  const [selectedMode, setSelectedMode] = useState('Auto'); // 'Auto', 'Draft', 'Research', 'Query', 'Review'
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showMatterDropdown, setShowMatterDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isTemporarySession, setIsTemporarySession] = useState(false);

  // Hidden attachment input ref
  const dockFileInputRef = useRef(null);
  const chatMessagesEndRef = useRef(null);

  // Modals
  const [showNewMatterModal, setShowNewMatterModal] = useState(false);
  const [newMatterTitle, setNewMatterTitle] = useState('');
  const [newMatterClient, setNewMatterClient] = useState('');
  const [newMatterPerspective, setNewMatterPerspective] = useState('CLAIMANT_PETITIONER');
  const [isCreatingMatter, setIsCreatingMatter] = useState(false);

  // Delete chat / consultation modal state
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [deleteChatError, setDeleteChatError] = useState(null);

  const handleRequestDeleteChat = (chatItem) => {
    setChatToDelete(chatItem);
    setDeleteChatError(null);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeletingChat) return;
    setShowDeleteModal(false);
    setChatToDelete(null);
    setDeleteChatError(null);
  };

  const handleConfirmDeleteChat = async () => {
    if (!chatToDelete) return;
    setIsDeletingChat(true);
    setDeleteChatError(null);

    // Delete independent argument session
    if (chatToDelete?.isFreeArg) {
      try {
        deleteFreeArgSession(chatToDelete.sessionId);
        setFreeArgSessions(loadFreeArgSessions());
        if (selectedFreeArgSession?.sessionId === chatToDelete.sessionId) {
          setSelectedFreeArgSession(null);
          navigate('/workspaces?tab=home', { replace: true });
          setActiveView('home');
        }
        setShowDeleteModal(false);
        setChatToDelete(null);
      } catch (err) {
        setDeleteChatError(err.message || 'Failed to delete argument session.');
      } finally {
        setIsDeletingChat(false);
      }
      return;
    }

    const targetWsId = chatToDelete.workspaceId;

    try {
      if (targetWsId) {
        // Permanently delete from PostgreSQL database
        await deleteWorkspace(targetWsId);

        // Delete from local storage cache
        try {
          localStorage.removeItem(`refirm_chat_history_${targetWsId}`);
        } catch (e) {
          console.warn('Failed to clear local storage for deleted workspace:', e);
        }

        // Remove from workspaces list state
        setWorkspaces((prev) => prev.filter((w) => w.workspaceId !== targetWsId));

        // If the deleted workspace was currently active, reset and navigate home
        if (selectedWorkspaceId === targetWsId || currentWorkspace?.workspaceId === targetWsId) {
          setSelectedWorkspaceId(null);
          setWorkspaceDetail(null);
          setChatMessages([]);
          setActiveChatTitle('');
          navigate('/workspaces?tab=home', { replace: true });
          setActiveView('home');
        }
      } else {
        // In-memory active session without persisted DB workspaceId
        try {
          localStorage.removeItem('refirm_chat_history_session');
        } catch (e) {
          console.warn('Failed to clear session storage:', e);
        }
        setChatMessages([]);
        setActiveChatTitle('');
        navigate('/workspaces?tab=home', { replace: true });
        setActiveView('home');
      }

      setShowDeleteModal(false);
      setChatToDelete(null);
    } catch (err) {
      console.error('Failed to delete consultation / workspace:', err);
      setDeleteChatError(err.message || 'Failed to delete from database. Please try again.');
    } finally {
      setIsDeletingChat(false);
    }
  };

  // Dismiss modal on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showDeleteModal && !isDeletingChat) {
        handleCloseDeleteModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteModal, isDeletingChat]);

  // Synchronize route workspace ID when browser Back or Forward button is pressed
  useEffect(() => {
    if (routeWorkspaceId && routeWorkspaceId !== selectedWorkspaceId) {
      setSelectedWorkspaceId(routeWorkspaceId);
      const cached = loadLocalChat(routeWorkspaceId);
      if (cached && cached.length > 0) {
        setChatMessages(cached);
      } else {
        setChatMessages([]);
      }
    }
  }, [routeWorkspaceId]);

  // Sync tab query param
  useEffect(() => {
    if (tabParam && ['matter', 'chat', 'drafting', 'documents', 'review', 'arguments', 'home'].includes(tabParam)) {
      setActiveView(tabParam);
    }
  }, [tabParam]);

  // Fetch workspaces list
  const fetchWorkspaces = async () => {
    setLoadingList(true);
    try {
      const data = await listWorkspaces();
      const list = data || [];
      setWorkspaces(list);

      if (!selectedWorkspaceId && list.length > 0 && routeWorkspaceId) {
        setSelectedWorkspaceId(routeWorkspaceId);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Fetch selected workspace detail and hydrate chat history from PostgreSQL DB
  useEffect(() => {
    if (!selectedWorkspaceId || selectedWorkspaceId === 'ws-default' || selectedWorkspaceId === 'default-ws' || selectedWorkspaceId === 'new') return;

    // Immediately restore from local storage if state is empty
    const cached = loadLocalChat(selectedWorkspaceId);
    if (cached && cached.length > 0 && chatMessages.length === 0) {
      setChatMessages(cached);
    }

    const loadDetail = async () => {
      setLoadingDetail(true);
      try {
        const detail = await getWorkspace(selectedWorkspaceId);
        setWorkspaceDetail(detail);

        // HYDRATE FROM DATABASE CHAT HISTORY
        const dbTurns = detail?.workspace?.chatHistory;
        if (dbTurns && Array.isArray(dbTurns) && dbTurns.length > 0) {
          const formattedDbMessages = dbTurns.map((turn, index) => {
            const isUser = turn.role === 'USER';
            return {
              id: `db-${index}-${turn.timestamp || index}`,
              sender: isUser ? 'user' : 'assistant',
              sectionTitle: isUser ? null : 'Legal Analysis',
              text: turn.message,
              timestamp: turn.timestamp
                ? new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Earlier',
              expanded: true,
            };
          });

          setChatMessages((current) => {
            // If current memory already has these or more recent messages, preserve them
            if (current && current.length >= formattedDbMessages.length) {
              saveLocalChat(selectedWorkspaceId, current);
              return current;
            }
            // Enhance formattedDbMessages with any rich cards/citations already in current
            const merged = formattedDbMessages.map((dbMsg, idx) => {
              const existing = current?.[idx];
              if (existing && existing.whatIsNextCards) {
                return { ...dbMsg, whatIsNextCards: existing.whatIsNextCards, citations: existing.citations };
              }
              return dbMsg;
            });
            saveLocalChat(selectedWorkspaceId, merged);
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to load workspace detail:', err);
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetail();
  }, [selectedWorkspaceId]);

  // Auto-persist chatMessages to localStorage whenever they update
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      saveLocalChat(selectedWorkspaceId, chatMessages);
    }
  }, [chatMessages, selectedWorkspaceId]);

  // Scroll to bottom on new chat messages
  useEffect(() => {
    if (activeView === 'chat') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeView]);

  // Active workspace object
  const currentWorkspace =
    workspaceDetail?.workspace ||
    workspaces.find((w) => w.workspaceId === selectedWorkspaceId) ||
    (workspaces.length > 0
      ? workspaces[0]
      : {
          workspaceId: selectedWorkspaceId || 'ws-default',
          title: 'My Legal Matter',
          clientName: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          documents: [],
        });

  // Navigate to tab with URL history synchronization for browser back/forward buttons
  const navigateToTab = (viewKey) => {
    const effectiveKey = viewKey === 'arguments' ? 'free-arguments' : viewKey;
    setActiveView(effectiveKey);
    const targetWsId = selectedWorkspaceId || routeWorkspaceId;
    if (targetWsId) {
      navigate(`/workspaces/${targetWsId}?tab=${effectiveKey}`, { replace: false });
    } else {
      navigate(`/workspaces?tab=${effectiveKey}`, { replace: false });
    }
  };

  // Switch Matter
  const handleSelectWorkspace = (wsId) => {
    setSelectedWorkspaceId(wsId);
    setShowMatterDropdown(false);
    const cached = loadLocalChat(wsId);
    if (cached && cached.length > 0) {
      setChatMessages(cached);
    }
    navigate(`/workspaces/${wsId}?tab=matter`, { replace: false });
    setActiveView('matter');
  };

  // Start new chat with matter
  const handleStartNewChatWithMatter = (ws) => {
    const targetWsId = ws?.workspaceId || currentWorkspace?.workspaceId;
    setActiveChatTitle(`${ws?.title || currentWorkspace?.title || 'Matter'} · Chat`);
    const initialMsg = [
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        sectionTitle: 'Matter Chat Initialized',
        text: `Ready to assist with **${ws?.title || currentWorkspace?.title}**. You can draft pleadings, inspect evidence, or prepare statutory rebuttals.`,
        timestamp: 'Just now',
        expanded: true,
      },
    ];
    setChatMessages(initialMsg);
    if (targetWsId) {
      saveLocalChat(targetWsId, initialMsg);
      navigate(`/workspaces/${targetWsId}?tab=chat`, { replace: false });
    }
    setActiveView('chat');
  };

  // Handle Task Card Click (Screenshots 1 & 2)
  const handleTaskCardClick = (task) => {
    setSelectedTaskId(task.id);
    if (task.action === 'ocr') {
      navigateToTab('documents');
    } else if (task.action === 'translation') {
      navigateToTab('documents');
    } else if (task.action === 'documents') {
      navigateToTab('documents');
    } else if (task.action === 'drafting') {
      navigateToTab('drafting');
    } else if (task.action === 'arguments') {
      setSelectedFreeArgSession(null);
      navigateToTab('free-arguments');
    } else if (task.action === 'matter_track') {
      navigateToTab('matter');
    } else {
      setSelectedMode(task.mode || 'Auto');
      setPromptInput(task.initialPrompt || '');
      navigateToTab('chat');
    }
  };

  // Open existing chat thread or argument session
  const handleOpenChat = (chatItem) => {
    if (chatItem?.isFreeArg) {
      setSelectedFreeArgSession(chatItem.sessionData || { sessionId: chatItem.sessionId, matterTitle: chatItem.title });
      navigateToTab('free-arguments');
      return;
    }
    if (chatItem?.title) {
      setActiveChatTitle(chatItem.title);
    }
    const targetWsId = chatItem?.workspaceId;
    if (targetWsId) {
      setSelectedWorkspaceId(targetWsId);
      const cached = loadLocalChat(targetWsId);
      if (cached && cached.length > 0) {
        setChatMessages(cached);
      }
      navigate(`/workspaces/${targetWsId}?tab=chat`, { replace: false });
    }
    setActiveView('chat');
  };

  // Send message from dock
  const handleSendPrompt = async (e) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isAssistantThinking) return;

    const userText = promptInput.trim();
    setPromptInput('');

    const newMsgId = `usr-${Date.now()}`;
    const userMessage = {
      id: newMsgId,
      sender: 'user',
      text: userText,
      timestamp: 'Just now',
    };

    setChatMessages((prev) => {
      const next = [...prev, userMessage];
      saveLocalChat(selectedWorkspaceId, next);
      return next;
    });
    setActiveView('chat');
    if (selectedWorkspaceId) {
      navigate(`/workspaces/${selectedWorkspaceId}?tab=chat`, { replace: false });
    }
    setIsAssistantThinking(true);

    try {
      const isRealWs =
        selectedWorkspaceId &&
        selectedWorkspaceId !== 'default-ws' &&
        selectedWorkspaceId !== 'ws-default' &&
        selectedWorkspaceId !== 'new';
      const targetWsId = isRealWs ? selectedWorkspaceId : null;

      const normalizedMode = (selectedMode || 'AUTO').toUpperCase();

      const response = await submitWorkspacePrompt(targetWsId, {
        promptText: userText,
        executionMode: normalizedMode,
        responseLanguage: selectedLanguage,
        temporary: isTemporarySession,
      });

      const effectiveWsId = response?.workspaceId || targetWsId;

      if (response?.workspaceId && response.workspaceId !== selectedWorkspaceId) {
        setSelectedWorkspaceId(response.workspaceId);
        fetchWorkspaces();
      }

      // If prompt router created an argument sheet (Archetype 4), open Argument Studio immediately
      if (response?.createdArtifact && (response.createdArtifact.artifactType === 'ARGUMENT_SHEET' || response.createdArtifact.type === 'ARGUMENT_SHEET')) {
        const sheetId = response.createdArtifact.artifactId || response.createdArtifact.id;
        setSelectedFreeArgSession({
          sessionId: `arg-${sheetId}`,
          matterTitle: response.createdArtifact.title || 'Courtroom Argument Sheet',
          linkedWorkspaceId: effectiveWsId,
          sheetId: sheetId,
          version: response.createdArtifact.version,
        });
        setActiveView('free-arguments');
        if (effectiveWsId) {
          navigate(`/workspaces/${effectiveWsId}?tab=free-arguments&sheetId=${sheetId}`, { replace: false });
        }
        return;
      }

      const answerText =
        response?.answerMarkdown ||
        response?.answer ||
        response?.content ||
        'Pleading analysis processed against matter ledger.';

      const asstMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        sectionTitle: selectedMode || 'Response',
        text: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        expanded: true,
        whatIsNextCards: response?.whatIsNextCards || [],
        citations: response?.citations || [],
      };

      setChatMessages((prev) => {
        const nextList = [...prev, asstMessage];
        if (effectiveWsId) {
          saveLocalChat(effectiveWsId, nextList);
        }
        return nextList;
      });

      if (effectiveWsId) {
        navigate(`/workspaces/${effectiveWsId}?tab=chat`, { replace: false });
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          sectionTitle: 'Notice',
          isError: true,
          text: `⚠️ **Unable to process prompt**: ${err.message || 'Server error'}. Please verify that the backend API is reachable.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          expanded: true,
        },
      ]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  // Directly executes a prompt (used by What's Next follow-up chips and research card)
  const executePromptDirectly = async (text, mode = 'AUTO') => {
    if (!text || isAssistantThinking) return;

    const userMsgId = `usr-${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      sender: 'user',
      text: text,
      timestamp: 'Just now',
    };

    setChatMessages((prev) => {
      const next = [...prev, userMessage];
      saveLocalChat(selectedWorkspaceId, next);
      return next;
    });
    setActiveView('chat');
    setIsAssistantThinking(true);

    try {
      const isRealWs =
        selectedWorkspaceId &&
        selectedWorkspaceId !== 'default-ws' &&
        selectedWorkspaceId !== 'ws-default' &&
        selectedWorkspaceId !== 'new';
      const targetWsId = isRealWs ? selectedWorkspaceId : null;

      const response = await submitWorkspacePrompt(targetWsId, {
        promptText: text,
        executionMode: mode.toUpperCase(),
        responseLanguage: selectedLanguage,
        temporary: isTemporarySession,
      });

      const effectiveWsId = response?.workspaceId || targetWsId;

      if (response?.workspaceId && response.workspaceId !== selectedWorkspaceId) {
        setSelectedWorkspaceId(response.workspaceId);
        fetchWorkspaces();
      }

      // If prompt router created an argument sheet (Archetype 4), open Argument Studio immediately
      if (response?.createdArtifact && (response.createdArtifact.artifactType === 'ARGUMENT_SHEET' || response.createdArtifact.type === 'ARGUMENT_SHEET')) {
        const sheetId = response.createdArtifact.artifactId || response.createdArtifact.id;
        setSelectedFreeArgSession({
          sessionId: `arg-${sheetId}`,
          matterTitle: response.createdArtifact.title || 'Courtroom Argument Sheet',
          linkedWorkspaceId: effectiveWsId,
          sheetId: sheetId,
          version: response.createdArtifact.version,
        });
        setActiveView('free-arguments');
        if (effectiveWsId) {
          navigate(`/workspaces/${effectiveWsId}?tab=free-arguments&sheetId=${sheetId}`, { replace: false });
        }
        return;
      }

      const answerText =
        response?.answerMarkdown ||
        response?.answer ||
        response?.content ||
        'Pleading analysis processed against matter ledger.';

      const asstMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        sectionTitle: mode === 'RESEARCH' ? 'Legal Research Memo' : (selectedMode || 'Response'),
        text: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        expanded: true,
        whatIsNextCards: response?.whatIsNextCards || [],
        citations: response?.citations || [],
      };

      setChatMessages((prev) => {
        const nextList = [...prev, asstMessage];
        if (effectiveWsId) {
          saveLocalChat(effectiveWsId, nextList);
        }
        return nextList;
      });

      if (effectiveWsId) {
        navigate(`/workspaces/${effectiveWsId}?tab=chat`, { replace: false });
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          sectionTitle: 'Notice',
          isError: true,
          text: `⚠️ **Unable to process prompt**: ${err.message || 'Server error'}. Please verify that the backend API is reachable.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          expanded: true,
        },
      ]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  // Create new matter
  const handleCreateMatterSubmit = async (e) => {
    e.preventDefault();
    if (!newMatterTitle.trim()) return;
    setIsCreatingMatter(true);
    try {
      const created = await createCaseProject({
        caseTitle: newMatterTitle.trim(),
        clientName: newMatterClient.trim() || 'General Client',
        perspective: newMatterPerspective,
      });
      await fetchWorkspaces();
      setSelectedWorkspaceId(created.workspaceId);
      setShowNewMatterModal(false);
      setNewMatterTitle('');
      setNewMatterClient('');
      setActiveView('matter');
      navigate(`/workspaces/${created.workspaceId}?tab=matter`, { replace: false });
    } catch (err) {
      console.error('Create matter failed:', err);
      alert('Failed to create matter: ' + err.message);
    } finally {
      setIsCreatingMatter(false);
    }
  };

  // Attach file to prompt dock
  const handleDockFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newAttached = {
      id: `file-${Date.now()}`,
      name: file.name.length > 20 ? `${file.name.slice(0, 18)}...` : file.name,
      pages: 'Doc attached',
    };
    setAttachedFiles((prev) => [...prev, newAttached]);
    if (dockFileInputRef.current) dockFileInputRef.current.value = '';
  };

  // Copy message text
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Filtered sidebar chats derived dynamically from workspaces & active session
  const chatItems = useMemo(() => {
    const list = [];

    // If there is an active discussion with messages
    if (chatMessages.length > 0) {
      list.push({
        id: 'active-chat-session',
        title: activeChatTitle || (chatMessages[0]?.text ? (chatMessages[0].text.length > 38 ? `${chatMessages[0].text.slice(0, 36)}...` : chatMessages[0].text) : 'Current Chat'),
        subtitle: `${currentWorkspace?.title || 'Matter'} · ${chatMessages.length} message${chatMessages.length !== 1 ? 's' : ''}`,
        timeGroup: 'TODAY',
        active: activeView === 'chat',
        workspaceId: currentWorkspace?.workspaceId,
        hasArgumentSheet: !!currentWorkspace?.hasArgumentSheet,
      });
    }

    if (workspaces && workspaces.length > 0) {
      workspaces.forEach((ws) => {
        if (list.some((it) => it.workspaceId === ws.workspaceId)) return;
        list.push({
          id: `ws-chat-${ws.workspaceId}`,
          title: ws.title || 'Untitled Matter',
          subtitle: `${ws.clientName ? ws.clientName + ' · ' : ''}${formatDateDDMMYYYY(ws.updatedAt || ws.createdAt)}`,
          timeGroup: 'RECENT',
          active: activeView === 'chat' && selectedWorkspaceId === ws.workspaceId,
          workspaceId: ws.workspaceId,
          hasArgumentSheet: !!ws.hasArgumentSheet,
        });
      });
    }

    // Independent argument sessions
    if (freeArgSessions && freeArgSessions.length > 0) {
      freeArgSessions.forEach((s) => {
        const pLabel =
          s.perspective === 'CLAIMANT_PETITIONER'
            ? 'Claimant'
            : s.perspective === 'OPPOSITE_PARTY_RESPONDENT'
            ? 'Respondent'
            : 'Neutral';
        list.push({
          id: `freearg-${s.sessionId}`,
          sessionId: s.sessionId,
          isFreeArg: true,
          title: s.matterTitle || 'Independent Argument',
          subtitle: `${pLabel} · Independent Arguments`,
          timeGroup: 'RECENT',
          active: activeView === 'free-arguments' && selectedFreeArgSession?.sessionId === s.sessionId,
          sessionData: s,
        });
      });
    }

    if (!chatSearchQuery.trim()) return list;

    const q = chatSearchQuery.toLowerCase();
    return list.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.subtitle.toLowerCase().includes(q)
    );
  }, [
    workspaces,
    chatSearchQuery,
    activeView,
    selectedWorkspaceId,
    activeChatTitle,
    chatMessages,
    currentWorkspace,
    freeArgSessions,
    selectedFreeArgSession,
  ]);

  return (
    <div className="lawgic-app-container">
      {/* ─── HIDDEN ATTACHMENT INPUT ─── */}
      <input
        type="file"
        ref={dockFileInputRef}
        style={{ display: 'none' }}
        onChange={handleDockFileUpload}
      />

      {/* ─── TOP APP HEADER (EXACT IMAGES 1, 4, 5) ─── */}
      <header className="lawgic-top-header">
        <div className="header-left">
          <div className="lawgic-logo" onClick={() => navigateToTab('home')}>
            <svg
              className="logo-swirl-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 0v20M2 12h20" opacity="0.2" />
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z" />
              <path d="M12 7a5 5 0 1 1-5 5" />
            </svg>
            <span className="logo-text">Refirm</span>
          </div>
        </div>

        {/* Temporary Session Notice & Promote Action */}
        {(isTemporarySession || currentWorkspace?.temporary) && (
          <div className="temporary-session-badge">
            <Lock size={12} />
            <span>Temporary Session · Not saved to history</span>
            <button
              type="button"
              className="btn-promote-temp"
              onClick={() => setShowNewMatterModal(true)}
              title="Save this consultation as a permanent Matter"
            >
              Promote to Matter to Keep
            </button>
          </div>
        )}

        <div className="header-right">
          {/* Credits Dropdown */}
          <div className="credits-menu-wrap">
            <button
              className="btn-credits-dropdown"
              onClick={() => setShowCreditsMenu(!showCreditsMenu)}
            >
              <span className="credits-number">Credits left</span>
              <ChevronDown size={14} className="text-zinc-500" />
            </button>

            {showCreditsMenu && (
              <div className="credits-popover">
                <div className="credits-popover-title">Testing Workspace</div>
                <div className="credits-popover-balance">
                  Full testing access enabled across all AI drafting & research modules.
                </div>
                <button
                  className="btn-popover-refill"
                  onClick={() => setShowCreditsMenu(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Upgrade to Pro */}
          <button className="btn-upgrade-pro">
            <ArrowUpRight size={14} className="upgrade-icon" />
            <span>Upgrade to Pro</span>
          </button>

          {/* Help Icon */}
          <button className="btn-header-icon" title="Help & Documentation">
            <HelpCircle size={18} />
          </button>

          {/* User Profile Avatar */}
          <div className="user-avatar-wrap">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <div className="avatar-placeholder">R</div>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      {/* ─── APP BODY: SIDEBAR + MAIN CANVAS ─── */}
      <div className="lawgic-layout-body">
        {/* ─── WORKSPACE SIDEBAR (IMAGES 1, 3, 4, 5) ─── */}
        <aside className={`lawgic-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
          {sidebarCollapsed ? (
            /* COLLAPSED ICON RAIL (IMAGE 4) */
            <div className="sidebar-rail-icons">
              <button
                className="btn-rail-icon"
                onClick={() => setSidebarCollapsed(false)}
                title="Expand sidebar"
              >
                <Menu size={18} />
              </button>
              <button
                className={`btn-rail-icon ${activeView === 'matter' ? 'active' : ''}`}
                onClick={() => {
                  navigateToTab('matter');
                  setSidebarCollapsed(false);
                }}
                title="Matters"
              >
                <Briefcase size={18} />
              </button>
              <button
                className="btn-rail-icon"
                onClick={() => {
                  navigateToTab('matter');
                  setSidebarCollapsed(false);
                }}
                title="Case tracking"
              >
                <Landmark size={18} />
              </button>
              <button
                className={`btn-rail-icon ${activeView === 'documents' ? 'active' : ''}`}
                onClick={() => {
                  navigateToTab('documents');
                  setSidebarCollapsed(false);
                }}
                title="Documents"
              >
                <FileText size={18} />
              </button>
              <button
                className={`btn-rail-icon ${activeView === 'drafting' ? 'active' : ''}`}
                onClick={() => {
                  navigateToTab('drafting');
                  setSidebarCollapsed(false);
                }}
                title="Templates"
              >
                <Scale size={18} />
              </button>
              <button
                className={`btn-rail-icon ${activeView === 'free-arguments' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFreeArgSession(null);
                  navigateToTab('free-arguments');
                  setSidebarCollapsed(false);
                }}
                title="Arguments Studio (Independent)"
              >
                <Gavel size={18} />
              </button>
              <button
                className="btn-rail-icon"
                onClick={() => navigate('/judgments')}
                title="Judgments"
              >
                <BookOpen size={18} />
              </button>
              <div className="rail-spacer" />
              <button
                className="btn-rail-purple-plus"
                onClick={() => {
                  setSelectedWorkspaceId(null);
                  setWorkspaceDetail(null);
                  setChatMessages([]);
                  setActiveChatTitle('');
                  setSelectedReviewDoc(null);
                  setPromptInput('');
                  setSelectedMode('Auto');
                  setActiveView('home');
                  navigate('/workspaces?tab=home', { replace: false });
                  setSidebarCollapsed(false);
                }}
                title="Start new task / Clean Workspace"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            /* FULL EXPANDED SIDEBAR (IMAGES 1, 3, 5) */
            <div className="sidebar-expanded-content">
              {/* Workspace Title & Collapse Arrow */}
              <div className="sidebar-top-title-row">
                <span className="sidebar-workspace-title">Workspace</span>
                <button
                  className="btn-collapse-chevron"
                  onClick={() => setSidebarCollapsed(true)}
                  title="Collapse sidebar"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              {/* Navigation Menu Links */}
              <div className="sidebar-nav-menu">
                <div
                  className={`nav-menu-item ${activeView === 'matter' ? 'active' : ''}`}
                  onClick={() => navigateToTab('matter')}
                >
                  <div className="menu-item-left">
                    <Briefcase size={16} />
                    <span>Matters</span>
                  </div>
                  <ChevronRight size={14} className="menu-chevron" />
                </div>

                <div
                  className="nav-menu-item"
                  onClick={() => navigateToTab('matter')}
                >
                  <div className="menu-item-left">
                    <Landmark size={16} />
                    <span>Case tracking</span>
                  </div>
                  <ChevronRight size={14} className="menu-chevron" />
                </div>

                <div
                  className={`nav-menu-item ${activeView === 'documents' ? 'active' : ''}`}
                  onClick={() => navigateToTab('documents')}
                >
                  <div className="menu-item-left">
                    <FileText size={16} />
                    <span>Documents</span>
                  </div>
                </div>

                <div
                  className={`nav-menu-item ${activeView === 'drafting' ? 'active' : ''}`}
                  onClick={() => navigateToTab('drafting')}
                >
                  <div className="menu-item-left">
                    <Scale size={16} />
                    <span>Templates</span>
                  </div>
                </div>

                <div
                  className={`nav-menu-item ${activeView === 'free-arguments' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFreeArgSession(null);
                    navigateToTab('free-arguments');
                  }}
                >
                  <div className="menu-item-left">
                    <Gavel size={16} />
                    <span>Arguments</span>
                  </div>
                  <span className="sidebar-nav-badge">Studio</span>
                </div>

                <div
                  className="nav-menu-item"
                  onClick={() => navigate('/judgments')}
                >
                  <div className="menu-item-left">
                    <BookOpen size={16} />
                    <span>Judgments</span>
                  </div>
                </div>
              </div>

              {/* Search chats with purple plus button */}
              <div className="search-chats-row">
                <div className="search-input-pill">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  className="btn-purple-circle-plus"
                  onClick={() => {
                    setSelectedWorkspaceId(null);
                    setWorkspaceDetail(null);
                    setChatMessages([]);
                    setActiveChatTitle('');
                    setSelectedReviewDoc(null);
                    setPromptInput('');
                    setSelectedMode('Auto');
                    setActiveView('home');
                    navigate('/workspaces?tab=home', { replace: false });
                  }}
                  title="Start new task / Clean Workspace"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Grouped Chat History */}
              <div className="sidebar-chats-history">
                <div className="history-group-label">
                  {chatItems.some((c) => c.timeGroup === 'TODAY') ? 'TODAY' : 'RECENT CHATS'}
                </div>
                {chatItems.length > 0 ? (
                  chatItems.map((item) => (
                    <div
                      key={item.id}
                      className={`history-chat-card ${item.active ? 'active' : ''}`}
                      onClick={() => {
                        handleOpenChat(item);
                      }}
                    >
                      <div className="history-card-main">
                        <div className="history-card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.isFreeArg && (
                            <span className="history-gavel-badge" title="Independent Argument Session">
                              <Gavel size={11} />
                            </span>
                          )}
                          {item.hasArgumentSheet && (
                            <span className="history-args-badge" title="Contains Courtroom Argument Sheet">
                              Args
                            </span>
                          )}
                          <div className="history-card-title" title={item.title}>{item.title}</div>
                        </div>
                        <div className="history-card-sub">{item.subtitle}</div>
                      </div>
                      <button
                        type="button"
                        className="btn-history-delete"
                        title="Delete this chat"
                        aria-label={`Delete ${item.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestDeleteChat(item);
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="sidebar-empty-chats">
                    <span>No recent chats</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ─── MAIN CONTENT VIEW CANVAS ─── */}
        <main className="lawgic-main-canvas">
          {/* VIEW 0: LOGGED IN HOME DASHBOARD (EXACT SCREENSHOTS 1 & 2) */}
          {activeView === 'home' && (
            <div className="canvas-scroll-wrapper home-scroll-wrapper">
              <div className="home-dashboard-canvas">
                {/* 1. GREETING */}
                <div className="home-greeting-block">
                  <h1 className="home-greeting-heading">
                    {getGreeting()}
                    <br />
                    What are we working on?
                  </h1>

                  <div className="home-lang-selector-row">
                    <span>Response Language</span>
                    <button className="btn-home-lang-dropdown">
                      <strong>{selectedLanguage}</strong>
                      <ChevronDown size={13} />
                    </button>
                  </div>
                </div>



                {/* 3. CENTRAL INPUT BAR (ROUNDED PILL) */}
                <div className="home-central-input-bar">
                  {/* Mode Selector */}
                  <div className="dock-dropdown-wrap">
                    <button
                      type="button"
                      className="btn-home-input-dropdown"
                      onClick={() => {
                        setShowModeDropdown(!showModeDropdown);
                        setShowMatterDropdown(false);
                      }}
                    >
                      <span>{selectedMode}</span>
                      <ChevronDown size={13} className="selector-chevron" />
                    </button>

                    {showModeDropdown && (
                      <div className="dock-menu-popover mode-popover">
                        {MODES.map((m) => (
                          <div
                            key={m.id}
                            className={`popover-menu-item ${selectedMode === m.label ? 'active-purple' : ''}`}
                            onClick={() => {
                              setSelectedMode(m.label);
                              setShowModeDropdown(false);
                            }}
                          >
                            {m.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Matter Selector */}
                  <div className="dock-dropdown-wrap">
                    <button
                      type="button"
                      className="btn-home-input-dropdown"
                      onClick={() => {
                        setShowMatterDropdown(!showMatterDropdown);
                        setShowModeDropdown(false);
                      }}
                    >
                      <Briefcase size={13} className="text-zinc-600" />
                      <span className="truncate-text">
                        {currentWorkspace?.title
                          ? (currentWorkspace.title.length > 14
                              ? `${currentWorkspace.title.slice(0, 12)}...`
                              : currentWorkspace.title)
                          : 'Select Matter'}
                      </span>
                      <ChevronDown size={13} className="selector-chevron" />
                    </button>

                    {showMatterDropdown && (
                      <div className="dock-menu-popover matter-popover">
                        <div
                          className="popover-menu-item new-matter-item"
                          onClick={() => {
                            setShowMatterDropdown(false);
                            setShowNewMatterModal(true);
                          }}
                        >
                          Create new matter
                        </div>
                        {workspaces.map((ws) => (
                          <div
                            key={ws.workspaceId}
                            className={`popover-menu-item ${ws.workspaceId === selectedWorkspaceId ? 'active-matter' : ''}`}
                            onClick={() => handleSelectWorkspace(ws.workspaceId)}
                          >
                            {ws.title || 'Untitled Matter'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Text Input */}
                  <input
                    type="text"
                    className="home-bar-input"
                    placeholder="Ask about this matter..."
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendPrompt();
                      }
                    }}
                  />

                  {/* Temporary Mode Toggle Pill */}
                  <button
                    type="button"
                    className={`btn-home-temp-toggle ${isTemporarySession ? 'active' : ''}`}
                    onClick={() => setIsTemporarySession(!isTemporarySession)}
                    title={isTemporarySession ? 'Temporary Mode Active (Not saved to history)' : 'Enable Temporary Mode'}
                  >
                    <Lock size={13} />
                    <span>Temporary</span>
                  </button>

                  <button
                    type="button"
                    className="btn-home-bar-icon"
                    onClick={() => dockFileInputRef.current?.click()}
                    title="Attach document"
                  >
                    <Paperclip size={16} />
                  </button>

                  <button
                    type="button"
                    className={`btn-home-bar-send-circle ${promptInput.trim() ? 'can-send' : ''}`}
                    onClick={handleSendPrompt}
                    disabled={!promptInput.trim()}
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>

                {/* 4. TRACKER LABEL */}
                <div className="home-tasks-tracker-label">
                  START WITH A TASK
                </div>

                {/* 5. 3X3 GRID OF 9 TASK CARDS */}
                <div className="home-tasks-3x3-grid">
                  {TASK_CARDS.map((task) => (
                    <div
                      key={task.id}
                      className={`home-task-card ${selectedTaskId === task.id ? 'is-selected' : ''}`}
                      onClick={() => handleTaskCardClick(task)}
                    >
                      <h4 className="home-task-title">{task.title}</h4>
                      <p className="home-task-desc">{task.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW A: CASE FILE (EXACT IMAGE 5) */}
          {activeView === 'matter' && (
            <div className="canvas-scroll-wrapper">
              <MatterWarRoomDashboard
                workspace={currentWorkspace}
                onNavigateTab={(tabKey, extra) => {
                  if (tabKey === 'chat') {
                    if (extra?.chat) handleOpenChat(extra.chat);
                    else handleStartNewChatWithMatter(currentWorkspace);
                  } else if (tabKey === 'free-arguments') {
                    if (extra?.sheetId || extra?.sheet) {
                      setSelectedFreeArgSession({
                        sessionId: `arg-${extra.sheetId || extra.sheet?.sheetId}`,
                        matterTitle: extra.sheet?.title || currentWorkspace?.title || 'Courtroom Argument Sheet',
                        linkedWorkspaceId: currentWorkspace?.workspaceId,
                        sheetId: extra.sheetId || extra.sheet?.sheetId,
                        sheet: extra.sheet,
                      });
                    }
                    navigateToTab('free-arguments');
                  } else {
                    navigateToTab(tabKey);
                  }
                }}
                onRefreshWorkspace={fetchWorkspaces}
                onStartNewChat={handleStartNewChatWithMatter}
                onOpenChat={handleOpenChat}
              />
            </div>
          )}

          {/* VIEW B: CHAT STUDIO (EXACT IMAGES 1, 3, 4) */}
          {activeView === 'chat' && (
            <div className="chat-studio-container">
              {/* Messages Thread */}
              <div className="chat-messages-thread">
                {chatMessages.length === 0 ? (
                  <div className="chat-empty-thread-canvas">
                    <div className="chat-empty-icon-circle">
                      <Sparkles size={24} className="text-purple-600" />
                    </div>
                    <h3 className="chat-empty-heading">
                      {currentWorkspace?.title ? `Chat with ${currentWorkspace.title}` : 'Legal Workspace Chat'}
                    </h3>
                    <p className="chat-empty-subheading">
                      Ask legal questions, prepare rebuttal arguments, or draft pleadings using Refirm AI.
                    </p>
                    <div className="chat-empty-suggestions-grid">
                      <button
                        type="button"
                        className="chat-empty-suggestion-card"
                        onClick={() => {
                          setPromptInput('Summarize the legal claims and relevant facts in this matter');
                        }}
                      >
                        <span className="suggestion-action">Summarize claims</span>
                        <span className="suggestion-text">Identify core issues, facts, and statutory provisions</span>
                      </button>
                      <button
                        type="button"
                        className="chat-empty-suggestion-card"
                        onClick={() => {
                          setPromptInput('Draft an objection memorandum citing relevant statutory provisions');
                        }}
                      >
                        <span className="suggestion-action">Draft objection</span>
                        <span className="suggestion-text">Formulate arguments and cite binding precedents</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`chat-message-row ${isUser ? 'user-row' : 'assistant-row'}`}
                      >
                        {isUser ? (
                          /* USER BUBBLE (ROUNDED GRAY CARD ON RIGHT) */
                          <div className="user-bubble-card">
                            <p>{msg.text}</p>
                          </div>
                        ) : (
                          /* ASSISTANT CARD (WHITE BORDERED CARD ON LEFT) */
                          <div className="assistant-response-card">
                            <div className="assistant-card-top-bar">
                              <span className="card-section-label">
                                {msg.sectionTitle || 'Issue'}
                              </span>
                              <div className="card-top-actions">
                                <button
                                  className="btn-card-action"
                                  onClick={() => handleCopyText(msg.text)}
                                  title="Copy response"
                                >
                                  <Copy size={15} />
                                </button>
                                <button
                                  className="btn-card-action"
                                  onClick={() => alert('Exporting draft response...')}
                                  title="Download draft"
                                >
                                  <Download size={15} />
                                </button>
                                <button
                                  className="btn-card-action"
                                  onClick={() => {
                                    setChatMessages((prev) =>
                                      prev.map((m) =>
                                        m.id === msg.id ? { ...m, expanded: !m.expanded } : m
                                      )
                                    );
                                  }}
                                  title={msg.expanded ? 'Collapse' : 'Expand'}
                                >
                                  {msg.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </div>
                            </div>

                            {msg.expanded && (
                              <div className="assistant-card-markdown-body">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeSanitize]}
                                >
                                  {msg.text}
                                </ReactMarkdown>

                                {msg.whatIsNextCards && msg.whatIsNextCards.length > 0 && (
                                  <div style={{ marginTop: '16px' }}>
                                    <WhatIsNextCards
                                      cards={msg.whatIsNextCards}
                                      onAction={async (card) => {
                                        if (card.actionType === 'INITIALIZE_TEMPLATE_DRAFT') {
                                          navigateToTab('drafting');
                                        } else if (card.actionType === 'OPEN_ARGUMENT_SHEET') {
                                          const wsId = selectedWorkspaceId || routeWorkspaceId;
                                          if (wsId && wsId !== 'default-ws' && wsId !== 'ws-default' && wsId !== 'new') {
                                            try {
                                              const sheets = await listArgumentSheets(wsId);
                                              const latest = sheets && sheets.length > 0 ? sheets[0] : null;
                                              if (!latest || latest.stale) {
                                                await generateArgumentSheet(wsId, {
                                                  partyPerspective: currentWorkspace?.partyPerspective || 'CLAIMANT_PETITIONER',
                                                });
                                              }
                                            } catch (err) {
                                              console.warn('Argument freshness check/generation:', err);
                                            }
                                          }
                                          navigateToTab('arguments');
                                        } else if (card.actionType === 'RUN_FOLLOWUP_PROMPT') {
                                          const promptToRun = card.suggestedPrompt || card.promptText;
                                          if (promptToRun) {
                                            setPromptInput(promptToRun);
                                            setSelectedMode('Research');
                                            executePromptDirectly(promptToRun, 'RESEARCH');
                                          }
                                        }
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {isAssistantThinking && (
                  <div className="chat-message-row assistant-row">
                    <div className="assistant-response-card thinking-card">
                      <div className="assistant-card-top-bar">
                        <span className="card-section-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={13} className="text-indigo-600" />
                          <span>Refirm AI</span>
                        </span>
                      </div>
                      <div className="assistant-card-markdown-body thinking-body">
                        <div className="thinking-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <span className="thinking-label">Analyzing matter facts and statutory grounds...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* FLOATING PROMPT DOCK (EXACT IMAGES 1, 3) */}
              <div className="floating-prompt-dock-container">
                {attachedFiles.length > 0 && (
                  <div className="toast-badge-pill" style={{ marginBottom: '8px', alignSelf: 'flex-start' }}>
                    <Paperclip size={12} />
                    <span>{attachedFiles.length} file{attachedFiles.length !== 1 ? 's' : ''} attached</span>
                  </div>
                )}

                {/* Attached File Chip */}
                {attachedFiles.length > 0 && (
                  <div className="attached-files-row">
                    {attachedFiles.map((f) => (
                      <div key={f.id} className="file-chip-pill">
                        <FileText size={13} className="text-indigo-600" />
                        <span>{f.name} · {f.pages}</span>
                        <button
                          className="btn-remove-chip"
                          onClick={() => setAttachedFiles((arr) => arr.filter((x) => x.id !== f.id))}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Card Container */}
                <div className="prompt-dock-card">
                  <textarea
                    rows={1}
                    className="dock-textarea"
                    placeholder="Ask a follow-up or start something new..."
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendPrompt();
                      }
                    }}
                  />

                  {/* Bottom Toolbar inside Prompt Dock */}
                  <div className="dock-bottom-toolbar">
                    <div className="dock-left-controls">
                      {/* Mode Dropdown (Image 3) */}
                      <div className="dock-dropdown-wrap">
                        <button
                          type="button"
                          className="btn-dock-selector"
                          onClick={() => {
                            setShowModeDropdown(!showModeDropdown);
                            setShowMatterDropdown(false);
                          }}
                        >
                          <span>{selectedMode}</span>
                          <ChevronUp size={13} className="selector-chevron" />
                        </button>

                        {showModeDropdown && (
                          <div className="dock-menu-popover mode-popover">
                            {MODES.map((m) => (
                              <div
                                key={m.id}
                                className={`popover-menu-item ${selectedMode === m.label ? 'active-purple' : ''}`}
                                onClick={() => {
                                  setSelectedMode(m.label);
                                  setShowModeDropdown(false);
                                }}
                              >
                                {m.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Matter Dropdown (Image 3) */}
                      <div className="dock-dropdown-wrap">
                        <button
                          type="button"
                          className="btn-dock-selector"
                          onClick={() => {
                            setShowMatterDropdown(!showMatterDropdown);
                            setShowModeDropdown(false);
                          }}
                        >
                          <Briefcase size={13} className="text-zinc-600" />
                          <span className="truncate-text">
                            {currentWorkspace?.title
                              ? (currentWorkspace.title.length > 14
                                  ? `${currentWorkspace.title.slice(0, 12)}...`
                                  : currentWorkspace.title)
                              : 'Select Matter'}
                          </span>
                          <ChevronDown size={13} className="selector-chevron" />
                        </button>

                        {showMatterDropdown && (
                          <div className="dock-menu-popover matter-popover">
                            <div
                              className="popover-menu-item new-matter-item"
                              onClick={() => {
                                setShowMatterDropdown(false);
                                setShowNewMatterModal(true);
                              }}
                            >
                              Create new matter
                            </div>
                            {workspaces.map((ws) => (
                              <div
                                key={ws.workspaceId}
                                className={`popover-menu-item ${ws.workspaceId === selectedWorkspaceId ? 'active-matter' : ''}`}
                                onClick={() => handleSelectWorkspace(ws.workspaceId)}
                              >
                                {ws.title || 'Untitled Matter'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Temporary Mode Toggle Pill */}
                      <button
                        type="button"
                        className={`btn-dock-temp-toggle ${isTemporarySession ? 'active' : ''}`}
                        onClick={() => setIsTemporarySession(!isTemporarySession)}
                        title={isTemporarySession ? 'Temporary Mode Active (Not saved to history)' : 'Enable Temporary Mode'}
                      >
                        <Lock size={12} />
                        <span>Temporary</span>
                      </button>
                    </div>

                    <div className="dock-right-controls">
                      {/* Paperclip button */}
                      <button
                        type="button"
                        className="btn-dock-icon"
                        onClick={() => dockFileInputRef.current?.click()}
                        title="Attach evidence or judgment"
                      >
                        <Paperclip size={15} />
                        {attachedFiles.length > 0 && (
                          <span className="dock-count-badge">{attachedFiles.length}</span>
                        )}
                      </button>

                      {/* Language dropdown */}
                      <button type="button" className="btn-dock-lang">
                        <span>{selectedLanguage}</span>
                        <ChevronDown size={12} />
                      </button>

                      {/* Circular Send Button */}
                      <button
                        type="button"
                        className={`btn-dock-send-circle ${promptInput.trim() && !isAssistantThinking ? 'can-send' : ''}`}
                        onClick={handleSendPrompt}
                        disabled={!promptInput.trim() || isAssistantThinking}
                      >
                        <ArrowUp size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="dock-footer-disclaimer">
                  Refirm can make mistakes. Check important info.
                </div>
              </div>
            </div>
          )}

          {/* VIEW C: DRAFTING STUDIO */}
          {activeView === 'drafting' && (
            <div className="canvas-scroll-wrapper">
              <DraftingStudio
                workspace={currentWorkspace}
                onRefresh={fetchWorkspaces}
              />
            </div>
          )}

          {/* VIEW D: DOCUMENTS STUDIO (OCR & TRANSLATION - EXACT SCREENSHOTS 1 & 2) */}
          {activeView === 'documents' && (
            <div className="canvas-scroll-wrapper">
              <DocumentsStudio
                workspace={currentWorkspace}
                onRefresh={fetchWorkspaces}
                onOpenReview={(doc) => {
                  setSelectedReviewDoc(doc);
                  navigateToTab('review');
                }}
              />
            </div>
          )}

          {/* VIEW D2: DOCUMENT REVIEW STUDIO */}
          {activeView === 'review' && (
            <div className="canvas-scroll-wrapper">
              <div style={{ padding: '16px 28px 0 28px' }}>
                <button
                  onClick={() => navigateToTab('documents')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13.5px',
                    color: '#6366f1',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  <ChevronLeft size={16} /> Back to Documents
                </button>
              </div>
              <DocumentReviewStudio
                workspace={currentWorkspace}
                document={selectedReviewDoc}
                initialSelectedDoc={selectedReviewDoc}
                onClose={() => navigateToTab('documents')}
                onRefresh={fetchWorkspaces}
              />
            </div>
          )}

          {/* VIEW: INDEPENDENT ARGUMENTS STUDIO */}
          {(activeView === 'free-arguments' || activeView === 'arguments') && (
            <div className="studio-canvas-fill">
              <FreeArgumentsStudio
                workspaces={workspaces}
                activeSession={selectedFreeArgSession}
                onSessionCreated={(session) => {
                  setFreeArgSessions(loadFreeArgSessions());
                  setSelectedFreeArgSession(session);
                }}
                onNewSession={() => {
                  setSelectedFreeArgSession(null);
                }}
                onClose={() => navigateToTab('home')}
              />
            </div>
          )}
        </main>
      </div>

      {/* ─── CREATE NEW MATTER MODAL ─── */}
      {showNewMatterModal && (
        <div className="modal-backdrop-clean" onClick={() => setShowNewMatterModal(false)}>
          <div className="modal-card-clean" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-clean">
              <h3>Create New Matter</h3>
              <button className="btn-close-modal" onClick={() => setShowNewMatterModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateMatterSubmit} className="modal-form-clean">
              <div className="form-field-clean">
                <label>Matter / Case Title</label>
                <input
                  type="text"
                  placeholder="e.g. Commercial Lease Dispute & Injunction"
                  value={newMatterTitle}
                  onChange={(e) => setNewMatterTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-field-clean">
                <label>Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={newMatterClient}
                  onChange={(e) => setNewMatterClient(e.target.value)}
                />
              </div>
              <div className="form-field-clean">
                <label>Legal Perspective</label>
                <select
                  value={newMatterPerspective}
                  onChange={(e) => setNewMatterPerspective(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e4e4e7',
                    fontSize: '14px',
                    color: '#18181b',
                    outline: 'none',
                  }}
                >
                  <option value="CLAIMANT_PETITIONER">Claimant / Petitioner</option>
                  <option value="OPPOSITE_PARTY_RESPONDENT">Opposite Party / Respondent</option>
                  <option value="NEUTRAL_EVALUATOR">Neutral Evaluator</option>
                </select>
              </div>
              <div className="modal-actions-clean">
                <button
                  type="button"
                  className="btn-cancel-clean"
                  onClick={() => setShowNewMatterModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save-clean"
                  disabled={isCreatingMatter}
                >
                  {isCreatingMatter ? 'Creating...' : 'Create Matter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE WARNING CONFIRMATION MODAL ─── */}
      {showDeleteModal && (
        <div
          className="delete-modal-backdrop"
          onClick={handleCloseDeleteModal}
        >
          <div
            className="delete-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="delete-modal-header">
              <div className="delete-modal-icon-badge">
                <AlertTriangle size={20} className="delete-modal-warning-icon" />
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseDeleteModal}
                disabled={isDeletingChat}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="delete-modal-body">
              <h3 id="delete-modal-title" className="delete-modal-title">
                {chatToDelete?.isFreeArg ? 'Delete Argument Session?' : 'Delete Consultation?'}
              </h3>
              <p className="delete-modal-description">
                Are you sure you want to delete{' '}
                <strong className="delete-modal-target-name">
                  &ldquo;{chatToDelete?.title || 'this session'}&rdquo;
                </strong>
                ?
              </p>
              <div className="delete-modal-warning-box">
                <p className="delete-modal-warning-text">
                  {chatToDelete?.isFreeArg
                    ? 'This action will permanently delete this independent argument session and its conversation history. This action cannot be undone.'
                    : 'This action will permanently delete this conversation and all associated documents, briefs, and notes from the database. This action cannot be undone.'}
                </p>
              </div>

              {deleteChatError && (
                <div className="delete-modal-error-banner">
                  {deleteChatError}
                </div>
              )}
            </div>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-cancel-clean"
                onClick={handleCloseDeleteModal}
                disabled={isDeletingChat}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-clean"
                onClick={handleConfirmDeleteChat}
                disabled={isDeletingChat}
              >
                {isDeletingChat ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
