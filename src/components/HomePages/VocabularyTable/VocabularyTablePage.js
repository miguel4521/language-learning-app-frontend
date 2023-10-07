import './VocabularyTablePage.scss';
import React, {useContext, useEffect, useState} from "react";
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import {HomeRouteContext} from "../../../contexts/HomeRouteContext";
import VocabularyTable from "./VocabularyTable";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {CircularProgress, Alert, Dialog} from "@mui/material";
import PublishIcon from "@mui/icons-material/Publish";
import axios from "axios";
import {useAuth0} from "@auth0/auth0-react";
import {useNavigate} from "react-router-dom";

function VocabularyTablePage() {
    const {
        wordTable,
        activeLanguage,
        getActiveCountry,
        updateVocabTable,
        getSelectedLanguageSettings,
        handleSave,
        selectedLanguages,
        categories
    } = useContext(HomeRouteContext);
    const [openModal, setOpenModal] = useState(false);
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [words, setWords] = useState('');
    const {getAccessTokenSilently} = useAuth0();
    const [isAddingVocabulary, setIsAddingVocabulary] = useState(false);
    const [alert, setAlert] = useState({open: false, message: '', type: ''});
    const [isAlertHovered, setIsAlertHovered] = useState(false);
    const filteredTable = wordTable.filter((word) => {
        return word.minutes_until_due <= 0;
    });
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (alert.open && !isAlertHovered) {
            const timer = setTimeout(() => {
                if (!isAlertHovered) {
                    setAlert({...alert, open: false});
                }
            }, 5000);  // Close alert after 5 seconds if not hovered

            return () => {
                clearTimeout(timer);
            };
        }
    }, [alert, isAlertHovered]);

    async function addWords(words, validate) {
        setIsAddingVocabulary(true);
        axios.post("api/user/addvocabulary", {
            words: words,
            validate: validate
        }, {
            headers: {
                Authorization: `Bearer ${await getAccessTokenSilently()}`,
            }
        }).then((result) => {
            setOpenModal(false);
            if (result.data.addedWords.length === 0) return setAlert({
                open: true, message: `No words added`, type: 'error'
            });
            setAlert({open: true, message: `Added words: ${result.data.addedWords}`, type: 'success'});  // Update the alert state here
            updateVocabTable();
            setIsAddingVocabulary(false);
        }).catch((err) => {
            console.error(err)
            setOpenModal(false)
            setIsAddingVocabulary(false);
            updateVocabTable();
            setAlert({open: true, message: `Error adding vocabulary`, type: 'error'})
        });
    }

    async function onAddWords() {
        if (words.length === 0) return;
        setWords("")
        addWords(words, true);
    }

    function handleModalClose() {
        if (words.length > 0) setOpenConfirmModal(true); else setOpenModal(false);
    }

    return (<div className="main-content">
        <div className="content-container">
            {alert.open && <Alert severity={alert.type}
                                  onClose={() => setAlert({...alert, open: false})}
                                  onMouseEnter={() => setIsAlertHovered(true)}
                                  onMouseLeave={() => setIsAlertHovered(false)}
                                  className="alert"
            >
                {alert.message}
            </Alert>}
            <div className="header-container">
                <div className="txt big"><strong>Your vocabulary for {activeLanguage}</strong></div>
                <img className="flag-img big" src={getActiveCountry()?.flag} alt=""/>
            </div>
            <div className="welcome-container">
                <div className="add-vocab-button-wrapper">
                    <button className="add-vocab-button button blue" onClick={() => setOpenModal(true)}>
                        <div className="button-txt">Add Vocabulary</div>
                        <div className="popup-wrapper"><ArrowOutwardIcon/></div>
                    </button>
                </div>
                {filteredTable.length > 0 && (getSelectedLanguageSettings()?.exercises.translation || getSelectedLanguageSettings()?.exercises.listening || getSelectedLanguageSettings()?.exercises.speaking) &&
                    <div className="practice-button-wrapper">
                        <button onClick={async () => {
                            handleSave(selectedLanguages.filter(lang => lang.name === activeLanguage)[0]);
                            // fuck it good enough
                            await new Promise(resolve => setTimeout(resolve, 100));
                            navigate("/practice");
                        }} className="practice-btn button">
                            <div className="button-txt">PRACTICE</div>
                            <div className="arrow-wrapper"><ArrowForwardIcon fontSize="inherit"/></div>
                        </button>
                    </div>}
            </div>
            <div className="vocab-table-page-wrapper">
                <div className="categories-grid">
                    {categories.map((category, index) => (
                        <button
                            key={index}
                            className="category-square button true-center"
                            onClick={() => {
                                setSelectedCategory(category);
                                setCategoryDialogOpen(true);
                            }}
                        >
                            {category.category}
                        </button>
                    ))}
                </div>
                <VocabularyTable wordTable={wordTable}/>
            </div>
        </div>
        <Dialog open={openModal} onClose={handleModalClose} scroll="body" maxWidth="lg" fullWidth={true}>
            <div className="modal-container">
                <div className="header-container">
                    <div className="txt">
                        <div>Add to your <strong>{activeLanguage}</strong> vocabulary list</div>
                    </div>
                </div>
                <textarea className="txt-field" placeholder="Add your vocabulary here..."
                          onChange={(e) => setWords(e.target.value)}/>
                <button className="button submit-vocab-button blue" onClick={onAddWords}
                        disabled={isAddingVocabulary}>
                    {isAddingVocabulary ? (
                        <div className="button-txt" style={{color: "white"}}><CircularProgress size="18px"
                                                                                               color="inherit"/>
                        </div>) : (<>
                        <div className="button-txt">Add vocabulary</div>
                        <div className="popup-wrapper">
                            <PublishIcon/>
                        </div>
                    </>)}
                </button>
                <button className="button close-modal-button" onClick={handleModalClose}>
                    Cancel
                </button>
            </div>
        </Dialog>
        <ConfirmModal
            open={openConfirmModal}
            onClose={() => setOpenConfirmModal(false)}
            onConfirm={() => setOpenModal(false)}
        />
        <CategoryDialog
            open={categoryDialogOpen}
            onClose={() => setCategoryDialogOpen(false)}
            category={selectedCategory}
            wordTable={wordTable}
            addWords={(words) => addWords(words, false)}
            isAddingVocabulary={isAddingVocabulary}
        />
    </div>);
}

export default VocabularyTablePage

function CategoryDialog({open, onClose, category, wordTable, addWords, isAddingVocabulary}) {
    if (!category) return null;
    const wordsForCategory = category.words;
    const combinedTable = wordsForCategory.map(word => {
        const wordObj = wordTable.find(w => w.word_id === word.word_id);
        const foundInWordTable = !!wordObj;
        return {...wordObj, ...word, foundInWordTable};
    });

    const addAllWords = () => {
        addWords(wordsForCategory.map(word => word.word));
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg">
            <div className="modal-container">
                <div className="header-container"><strong className="txt">Category: {category.category}</strong></div>
                <button className="button blue add-words-btn" onClick={addAllWords}>{isAddingVocabulary ? <CircularProgress size={20} /> : 'Add All Words'}</button>
                <VocabularyTable isCategoryView={true} wordTable={combinedTable} addWords={addWords} isAddingVocabulary={isAddingVocabulary}/>
                <button className="button close-modal-button" onClick={onClose}>
                    Close
                </button>
            </div>
        </Dialog>
    );
}

function ConfirmModal({open, onClose, onConfirm}) {
    function handleConfirmClose(shouldClose) {
        if (shouldClose) onConfirm();
        onClose();
    }

    return (<Dialog open={open} onClose={onClose}>
        <div className="modal-container">
            <div className="header-container" style={{marginBottom: "20px"}}>
                <div style={{fontSize: "20px"}}>
                    Close without saving?
                </div>
            </div>
            <div className="modal-buttons-container">
                <button
                    className="button confirm-button"
                    onClick={() => handleConfirmClose(true)}
                >
                    <div className="button-txt">Do not save</div>
                </button>
                <button
                    className="button cancel-button"
                    onClick={() => handleConfirmClose(false)}
                >
                    <div className="button-txt">Cancel</div>
                </button>
            </div>
        </div>
    </Dialog>);
}