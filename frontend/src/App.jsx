import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, VOTING_ABI } from './contractConfig';

function App() {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);

    const [candidates, setCandidates] = useState([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [isVotingActive, setIsVotingActive] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [deadline, setDeadline] = useState(0);
    const [winner, setWinner] = useState(null);
    const [totalVotes, setTotalVotes] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [votingFor, setVotingFor] = useState(null);

    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const formatTime = (seconds) => {
        if (seconds <= 0) return 'Ended';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        return `${hours}h ${minutes}m ${secs}s`;
    };

    const connectWallet = async () => {
        try {
            setError(null);

            if (!window.ethereum) {
                throw new Error('MetaMask not installed. Please install MetaMask to use this dApp.');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, VOTING_ABI, signer);

            setProvider(provider);
            setSigner(signer);
            setContract(contract);
            setAccount(accounts[0]);

            setSuccess('Wallet connected successfully!');
            setTimeout(() => setSuccess(null), 3000);

        } catch (err) {
            console.error('Connection error:', err);
            setError(err.message || 'Failed to connect wallet');
        }
    };

    const loadContractData = useCallback(async () => {
        if (!contract || !account) return;

        try {
            const [names, votes] = await contract.getAllResults();

            const candidatesData = names.map((name, index) => ({
                id: index,
                name: name,
                votes: Number(votes[index])
            }));

            setCandidates(candidatesData);
            setTotalVotes(candidatesData.reduce((sum, c) => sum + c.votes, 0));

            const voted = await contract.hasVoted(account);
            setHasVoted(voted);

            const active = await contract.isVotingActive();
            setIsVotingActive(active);

            const remaining = await contract.getTimeRemaining();
            setTimeRemaining(Number(remaining));

            const deadlineTimestamp = await contract.votingDeadline();
            setDeadline(Number(deadlineTimestamp));

            if (!active) {
                try {
                    const [winnerId, winnerName, winnerVotes] = await contract.getWinner();
                    setWinner({
                        id: Number(winnerId),
                        name: winnerName,
                        votes: Number(winnerVotes)
                    });
                } catch (e) {
                    console.log('Could not get winner yet');
                }
            }

        } catch (err) {
            console.error('Error loading contract data:', err);
            setError('Failed to load contract data. Make sure you are on the correct network.');
        }
    }, [contract, account]);

    const vote = async (candidateId) => {
        try {
            setError(null);
            setVotingFor(candidateId);

            const tx = await contract.vote(candidateId);

            setSuccess('Vote submitted! Waiting for confirmation...');

            await tx.wait();

            setSuccess('Vote confirmed! Thank you for voting.');
            setHasVoted(true);

            await loadContractData();

            setTimeout(() => setSuccess(null), 5000);

        } catch (err) {
            console.error('Voting error:', err);

            let errorMsg = 'Failed to cast vote';
            if (err.reason) {
                errorMsg = err.reason;
            } else if (err.message?.includes('AlreadyVoted')) {
                errorMsg = 'You have already voted!';
            } else if (err.message?.includes('VotingEnded')) {
                errorMsg = 'Voting has ended!';
            } else if (err.message?.includes('InvalidCandidate')) {
                errorMsg = 'Invalid candidate!';
            } else if (err.message?.includes('user rejected')) {
                errorMsg = 'Transaction cancelled by user';
            }

            setError(errorMsg);
        } finally {
            setVotingFor(null);
        }
    };

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    setAccount(null);
                    setContract(null);
                } else {
                    setAccount(accounts[0]);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }, []);

    useEffect(() => {
        if (contract && account) {
            loadContractData();
        }
    }, [contract, account, loadContractData]);

    useEffect(() => {
        if (!isVotingActive) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    setIsVotingActive(false);
                    loadContractData();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isVotingActive, loadContractData]);

    useEffect(() => {
        if (!contract) return;

        const interval = setInterval(loadContractData, 15000);
        return () => clearInterval(interval);
    }, [contract, loadContractData]);

    return (
        <div className="app">
            <header className="header">
                <h1>🗳️ VoteLedger</h1>
                <p>Transparent Blockchain Voting</p>
            </header>

            <div className="connection-panel">
                <div className="connection-info">
                    <div className={`status-indicator ${account ? 'connected' : ''}`}></div>
                    {account ? (
                        <span className="wallet-address">{formatAddress(account)}</span>
                    ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>Not connected</span>
                    )}
                </div>

                {!account ? (
                    <button className="btn btn-primary" onClick={connectWallet}>
                        🦊 Connect MetaMask
                    </button>
                ) : (
                    <button className="btn btn-secondary" onClick={loadContractData}>
                        🔄 Refresh
                    </button>
                )}
            </div>

            {error && (
                <div className="message error">
                    ❌ {error}
                </div>
            )}

            {success && (
                <div className="message success">
                    ✅ {success}
                </div>
            )}

            {!account ? (
                <div className="not-connected">
                    <h2>Welcome to VoteLedger</h2>
                    <p>
                        Connect your MetaMask wallet to participate in the election.
                        Your vote is recorded permanently on the blockchain.
                    </p>
                    <button className="btn btn-primary" onClick={connectWallet}>
                        🦊 Connect Wallet to Vote
                    </button>
                </div>
            ) : candidates.length === 0 ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading candidates...</p>
                </div>
            ) : (
                <>
                    <div className="voting-status">
                        <div className="status-item">
                            <div className="label">Status</div>
                            <div className={`value ${isVotingActive ? 'active' : 'ended'}`}>
                                {isVotingActive ? '🟢 Active' : '🔴 Ended'}
                            </div>
                        </div>
                        <div className="status-item">
                            <div className="label">Time Remaining</div>
                            <div className="value">{formatTime(timeRemaining)}</div>
                        </div>
                        <div className="status-item">
                            <div className="label">Total Votes</div>
                            <div className="value">{totalVotes}</div>
                        </div>
                        <div className="status-item">
                            <div className="label">Your Status</div>
                            <div className="value">
                                {hasVoted ? '✅ Voted' : '⏳ Not voted'}
                            </div>
                        </div>
                    </div>

                    {!isVotingActive && winner && (
                        <div className="winner-banner">
                            <h2>🏆 Winner</h2>
                            <div className="winner-name">{winner.name}</div>
                            <div className="winner-votes">{winner.votes} votes</div>
                        </div>
                    )}

                    <section className="candidates-section">
                        <h2 className="section-title">👥 Candidates</h2>

                        <div className="candidates-grid">
                            {candidates.map((candidate) => {
                                const votePercentage = totalVotes > 0
                                    ? (candidate.votes / totalVotes) * 100
                                    : 0;

                                return (
                                    <div
                                        key={candidate.id}
                                        className={`candidate-card ${winner?.id === candidate.id ? 'voted' : ''}`}
                                    >
                                        <span className="candidate-id">#{candidate.id}</span>
                                        <h3 className="candidate-name">{candidate.name}</h3>

                                        <div className="candidate-votes">
                                            <span className="vote-count">{candidate.votes}</span>
                                            <span className="vote-label">
                                                {candidate.votes === 1 ? 'vote' : 'votes'}
                                            </span>
                                        </div>

                                        <div className="vote-bar">
                                            <div
                                                className="vote-bar-fill"
                                                style={{ width: `${votePercentage}%` }}
                                            ></div>
                                        </div>

                                        {isVotingActive && !hasVoted && (
                                            <button
                                                className="btn btn-primary vote-button"
                                                onClick={() => vote(candidate.id)}
                                                disabled={votingFor !== null}
                                            >
                                                {votingFor === candidate.id ? (
                                                    <>🔄 Voting...</>
                                                ) : (
                                                    <>✓ Vote for {candidate.name}</>
                                                )}
                                            </button>
                                        )}

                                        {hasVoted && (
                                            <div className="message info" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                                                You have already voted
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}

            <footer className="footer">
                <p>
                    VoteLedger - Blockchain Voting System |
                    Contract: <a
                        href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {formatAddress(CONTRACT_ADDRESS)}
                    </a>
                </p>
            </footer>
        </div>
    );
}

export default App;
