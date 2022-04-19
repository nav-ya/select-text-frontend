import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const RECORDS = 'http://localhost:8000/records'

interface Chunk {
  id: string
  record_id: string
  start: number
  end: number
  chunk_text: string
}

interface Record {
  record_id: string
  record: string
  selected_chunks: Array<Chunk>
}

interface Props {
  records: Array<Record>
}

const Home: React.FC<Props> = ({ records }) => {
  const router = useRouter()
  const [activeRecord, setActiveRecord] = useState<Record>(records[0])

  function handleMouseUp() {
    if (window !== undefined && window.getSelection() !== null) {
      let newSelection = window?.getSelection()?.toString() || ''
      let start = activeRecord.record.indexOf(newSelection)
      let end = start + newSelection?.length || 0

      let updateChunks = activeRecord.selected_chunks

      if (newSelection !== '')
        updateChunks.push({
          id: (Math.random() + 1).toString(36).substring(6),
          record_id: activeRecord.record_id,
          start: start,
          end: end,
          chunk_text: newSelection,
        })

      setActiveRecord({
        ...activeRecord,
        selected_chunks: updateChunks,
      })

      let updatedRecord = {
        record_id: activeRecord.record_id,
        record: activeRecord.record,
        selected_chunks: updateChunks,
      }

      console.log(updatedRecord)

      fetch(`${RECORDS}/${updatedRecord.record_id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedRecord),
        headers: { 'Content-Type': 'application/json' },
      })
        .then((res) => res.json())
        .catch((err) => console.log(err))
    }
  }

  function highlightChunks() {
    let currentRecord = activeRecord?.record
    activeRecord?.selected_chunks.forEach((chunk) => {
      let subStringOfRecord = currentRecord.substring(chunk.start, chunk.end)
      let updatedSubStringOfRecord = `<mark>${subStringOfRecord}</mark>`
      let active = currentRecord
      let highlightedRecord = active.replace(
        subStringOfRecord,
        updatedSubStringOfRecord
      )
      setActiveRecord({ ...activeRecord, record: highlightedRecord })
    })
  }

  function deleteChunk(id: string) {
    fetch(`${RECORDS}/${activeRecord.record_id}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .catch((err) => console.log(err))
    router.reload()
  }

  useEffect(() => {
    highlightChunks()
  }, [activeRecord.record_id])

  return (
    <>
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100">
        <div className="lg:maxmax-w-screen-xl flex min-h-[600px] w-11/12 items-start justify-between bg-white px-6 py-5 md:w-3/4">
          <div className="w-full md:mr-3 md:w-1/3">
            <ul>
              {records.map((record, i) => (
                <li
                  key={i}
                  className={`mb-4 w-full cursor-pointer rounded-md border p-3 ${
                    activeRecord?.record_id === record.record_id
                      ? 'bg-orange-200'
                      : ''
                  } `}
                  onClick={() => setActiveRecord(record)}
                >
                  {record.record.replace(/<[^>]*>?/gm, '')}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:mr-3 md:w-1/3">
            <div
              dangerouslySetInnerHTML={{ __html: activeRecord?.record }}
              className="w-full border p-2 outline-none focus:border-orange-400"
              onMouseUp={handleMouseUp}
            ></div>
          </div>
          <div className="w-full md:w-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Text</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeRecord?.selected_chunks &&
                activeRecord?.selected_chunks.length > 0 ? (
                  activeRecord.selected_chunks?.map((chunk, i) => (
                    <tr key={i} className="h-[50px] border-b">
                      <td className="px-4">{i}</td>
                      <td className="px-4">{chunk.chunk_text}</td>
                      <td className="px-4">{chunk.start}</td>
                      <td className="px-4">{chunk.end}</td>
                      <td className="px-4">
                        <button
                          className="text-blue-600 underline"
                          onClick={() => deleteChunk(chunk.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps() {
  const records = await fetch(RECORDS, {
    method: 'GET',
  }).then((res) => res.json())

  return {
    props: {
      records,
    },
  }
}

export default Home
