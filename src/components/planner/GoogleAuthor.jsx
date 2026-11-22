import { externalUrl } from '../../utils/travelPresentation';

export default function GoogleAuthor({ author, showPhoto = true }) {
  if (!author) return null;
  const name = typeof author === 'string' ? author : author.name;
  const uri = externalUrl(author.uri);
  const photoUri = showPhoto && externalUrl(author.photoUri);
  const content = <>
    {photoUri && <img className="google-author-avatar" src={photoUri} alt="" loading="lazy" referrerPolicy="no-referrer" />}
    <span>{name}</span>
  </>;
  return uri
    ? <a className="google-author" href={uri} target="_blank" rel="noopener noreferrer">{content}</a>
    : <span className="google-author">{content}</span>;
}
