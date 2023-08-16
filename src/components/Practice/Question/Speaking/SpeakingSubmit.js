const SpeakingSubmit = ({result, setNextQuestion, listening}) => {
    return (
        <div className={`submit-wrapper-container`}>
            <div className={`submit-wrapper`} style={{margin: "0"}}>
                <button disabled={listening} className={`submit-btn ${listening ? 'disabled' : result ? '' : 'skip'}`}
                        style={{width: "100%"}}
                onClick={setNextQuestion}>
                    {result ? "Next" : "Skip"}
                </button>
            </div>
        </div>
    )
}

export default SpeakingSubmit